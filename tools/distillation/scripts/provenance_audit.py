#!/usr/bin/env python3
"""Generate read-only provenance reports for the three code-heavy projects.

The script reads original notes, source, configuration and historical build
artifacts, then writes only derived reports below ``distillation/``.  It does
not invoke Keil, J-Link, BCC, Qt, OpenCV or a target Linux kernel.  Therefore
its ``static`` findings are evidence about files and control flow, not claims
that a target system executed successfully.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any


VAULT = Path(__file__).resolve().parents[2]
DISTILLATION = VAULT / "distillation"


def rel(path: Path) -> str:
    return path.relative_to(VAULT).as_posix()


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_record(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {"path": rel(path), "exists": False}
    stat = path.stat()
    return {
        "path": rel(path),
        "exists": True,
        "size_bytes": stat.st_size,
        "sha256": sha256(path),
        "mtime": dt.datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_report(domain: str, stem: str, payload: dict[str, Any], lines: list[str]) -> None:
    output_dir = DISTILLATION / domain
    output_dir.mkdir(parents=True, exist_ok=True)
    write_json(output_dir / f"{stem}.json", payload)
    (output_dir / f"{stem}.md").write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def parse_hex_range(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {"valid": False, "reason": "file missing"}
    extended = 0
    addresses: list[int] = []
    data_bytes = 0
    records = 0
    errors: list[str] = []
    for line_no, line in enumerate(read(path).splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        if not line.startswith(":"):
            errors.append(f"line {line_no}: missing ':'")
            continue
        try:
            raw = bytes.fromhex(line[1:])
        except ValueError:
            errors.append(f"line {line_no}: invalid hex")
            continue
        if len(raw) < 5 or raw[0] + 5 != len(raw):
            errors.append(f"line {line_no}: record length mismatch")
            continue
        if sum(raw) & 0xFF:
            errors.append(f"line {line_no}: checksum mismatch")
        count = raw[0]
        address = int.from_bytes(raw[1:3], "big")
        record_type = raw[3]
        payload = raw[4 : 4 + count]
        if record_type == 0:
            absolute = (extended << 16) + address
            addresses.extend(range(absolute, absolute + count))
            data_bytes += count
            records += 1
        elif record_type == 4 and count == 2:
            extended = int.from_bytes(payload, "big")
    return {
        "valid": not errors,
        "records": records,
        "data_bytes": data_bytes,
        "min_address": min(addresses) if addresses else None,
        "max_exclusive_address": max(addresses) + 1 if addresses else None,
        "errors": errors[:20],
    }


def parse_map_facts(path: Path) -> dict[str, Any]:
    text = read(path) if path.is_file() else ""
    facts: dict[str, Any] = {}
    patterns = {
        "entry_point": r"Image entry point\s*:\s*(0x[0-9a-fA-F]+)",
        "vectors": r"^\s*__Vectors\s+(0x[0-9a-fA-F]+)",
        "vectors_end": r"^\s*__Vectors_End\s+(0x[0-9a-fA-F]+)",
        "reset_handler": r"^\s*Reset_Handler\s+(0x[0-9a-fA-F]+)",
        "main": r"^\s*main\s+(0x[0-9a-fA-F]+)",
        "rom_size": r"^\s*Total ROM Size .*?\s+(\d+)\s+\(",
        "ram_size": r"^\s*Total RW\s+Size .*?\s+(\d+)\s+\(",
    }
    for name, pattern in patterns.items():
        match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
        if match:
            value = match.group(1)
            facts[name] = int(value, 16) if value.lower().startswith("0x") else int(value)
    for name, pattern in {
        "load_region": r"^\s*Load Region LR_IROM1.*$",
        "execution_region_rom": r"^\s*Execution Region ER_IROM1.*$",
        "execution_region_ram": r"^\s*Execution Region RW_IRAM1.*$",
    }.items():
        match = re.search(pattern, text, re.MULTILINE)
        if match:
            facts[name] = match.group(0).strip()
    return facts


def parse_rtos() -> dict[str, Any]:
    project = VAULT / "projects/RTOS项目/源码/USER/project.uvprojx"
    obj = project.parent.parent / "OBJ"
    artifacts = {
        "project": project,
        "build_log": obj / "PWM.build_log.htm",
        "axf": obj / "PWM.axf",
        "bin": obj / "PWM.bin",
        "hex": obj / "PWM.hex",
        "scatter": obj / "PWM.sct",
        "map": project.parent / "PWM.map",
        "jlink_settings": project.parent / "JLinkSettings.ini",
    }
    tree = ET.parse(project)
    target = tree.getroot().find(".//Target")
    if target is None:
        raise RuntimeError(f"no target in {project}")
    common = target.find("TargetOption/TargetCommonOption")
    if common is None:
        raise RuntimeError(f"no TargetCommonOption in {project}")

    def text_at(parent: ET.Element, path: str) -> str:
        return (parent.findtext(path) or "").strip()

    target_files: list[dict[str, Any]] = []
    for file_node in target.findall(".//Groups/Group/Files/File"):
        raw = text_at(file_node, "FilePath")
        if not raw:
            continue
        normalized = raw.replace("\\", "/")
        source_path = (project.parent / normalized).resolve()
        target_files.append(
            {
                "declared": raw,
                "path": rel(source_path) if source_path.is_relative_to(VAULT) else str(source_path),
                "basename": Path(normalized).name,
                "exists": source_path.is_file(),
            }
        )

    log_text = read(artifacts["build_log"])
    built_names = [
        match.group(1).strip()
        for match in re.finditer(r"^\s*(?:compiling|assembling)\s+(.+?)\.\.\.\s*$", log_text, re.MULTILINE | re.IGNORECASE)
    ]
    target_names = [item["basename"] for item in target_files]
    target_set = set(target_names)
    built_set = set(built_names)
    map_facts = parse_map_facts(artifacts["map"])
    hex_facts = parse_hex_range(artifacts["hex"])
    build_size = re.search(r"Program Size:\s*([^\r\n<]+)", log_text, re.IGNORECASE)
    build_errors = re.search(r"(\d+) Error\(s\),\s*(\d+) Warning\(s\)", log_text, re.IGNORECASE)
    project_path = re.search(r"<h2>Project:</h2>\s*([^<\r\n]+)", log_text, re.IGNORECASE)
    toolchain_path = re.search(r"Toolchain Path:\s*([^\r\n]+)", log_text, re.IGNORECASE)
    package = re.search(r"Package Vendor:.*?\n\s*([^\r\n]+)", log_text, re.IGNORECASE | re.DOTALL)
    jlink_text = read(artifacts["jlink_settings"])

    config = {
        "target_name": text_at(target, "TargetName"),
        "device": text_at(common, "Device"),
        "pack_id": text_at(common, "PackID"),
        "toolchain": text_at(target, "ToolsetName"),
        "compiler": text_at(target, "pCCUsed"),
        "cpu": text_at(common, "Cpu"),
        "flash_driver": text_at(common, "FlashDriverDll"),
        "output_directory": text_at(common, "OutputDirectory"),
        "output_name": text_at(common, "OutputName"),
        "create_executable": text_at(common, "CreateExecutable"),
        "create_hex": text_at(common, "CreateHexFile"),
        "debug_information": text_at(common, "DebugInformation"),
        "defines": text_at(target, ".//Cads/VariousControls/Define"),
        "include_path": text_at(target, ".//Cads/VariousControls/IncludePath"),
        "invalid_flash_flag": text_at(common, "TargetStatus/InvalidFlash"),
        "target_dll": text_at(target, "TargetOption/DllOption/TargetDllName"),
        "target_dialog_dll": text_at(target, "TargetOption/DllOption/TargetDlgDll"),
    }
    settings = {}
    for key in ("VerifyDownload", "SkipProgOnCRCMatch", "EnableFlashDL", "Device"):
        match = re.search(r"^\s*" + re.escape(key) + r"\s*=\s*(.*?)\s*$", jlink_text, re.MULTILINE)
        if match:
            settings[key] = match.group(1).strip().strip('"')

    missing_from_log = sorted(target_set - built_set)
    extra_in_log = sorted(built_set - target_set)
    base_ok = (
        map_facts.get("vectors") == 0x08000000
        and hex_facts.get("min_address") == 0x08000000
        and map_facts.get("execution_region_rom", "").startswith("Execution Region ER_IROM1")
    )
    rtos = {
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "config": config,
        "target_files": target_files,
        "target_file_count": len(target_files),
        "build_log_units": built_names,
        "build_log_unit_count": len(built_names),
        "target_vs_build_log": {
            "same_basename_set": not missing_from_log and not extra_in_log,
            "missing_from_build_log": missing_from_log,
            "extra_in_build_log": extra_in_log,
        },
        "build_log": {
            "reported_project": project_path.group(1).strip() if project_path else None,
            "toolchain_path": toolchain_path.group(1).strip() if toolchain_path else None,
            "package": package.group(1).strip() if package else None,
            "program_size": build_size.group(1).strip() if build_size else None,
            "errors": int(build_errors.group(1)) if build_errors else None,
            "warnings": int(build_errors.group(2)) if build_errors else None,
            "contains_old_absolute_path": bool(re.search(r"[A-Za-z]:\\", log_text)),
        },
        "artifacts": {name: file_record(path) for name, path in artifacts.items()},
        "map_facts": map_facts,
        "hex_facts": hex_facts,
        "jlink_settings": settings,
        "static_assessment": {
            "C0_target_contract": "pass" if config["device"] and target_files else "blocked",
            "C1_historical_build_identity": "static-compatible" if not missing_from_log and base_ok else "needs-review",
            "C2_flash_program_verify": "not-evidenced",
            "C3_reset_boot_observation": "not-evidenced",
            "C4_serial_runtime_business": "not-evidenced",
        },
        "facts": {
            "map_hex_base_aligned": base_ok,
            "old_build_path_is_not_current_vault_path": bool(project_path and "D:\\" in project_path.group(1)),
            "invalid_flash_flag_is_set": config["invalid_flash_flag"] == "1",
            "jlink_device_unspecified": settings.get("Device") == "UNSPECIFIED",
            "project_target_dll_is_stlink": "ST-LINK" in config["target_dll"],
        },
        "source_files": [
            "projects/RTOS项目/源码/USER/project.uvprojx",
            "projects/RTOS项目/源码/OBJ/PWM.build_log.htm",
            "projects/RTOS项目/源码/USER/PWM.map",
            "projects/RTOS项目/源码/OBJ/PWM.hex",
            "projects/RTOS项目/源码/OBJ/PWM.axf",
            "projects/RTOS项目/源码/OBJ/PWM.bin",
            "projects/RTOS项目/源码/OBJ/PWM.sct",
            "projects/RTOS项目/源码/USER/JLinkSettings.ini",
        ],
    }

    lines = [
        "# RTOS 当前 target 与构建产物身份审计",
        "",
        "> 本报告只读取 Keil 工程、历史 Build log、AXF/HEX/MAP/Scatter 和下载配置；没有调用 Keil/J-Link，也没有声称目标板已烧录或运行。",
        "",
        "## 结论",
        "",
        f"- 当前 target：`{config['target_name']}` / `{config['device']}` / `{config['pack_id']}`。",
        f"- 工程声明的 target 文件：{len(target_files)} 个；Build log 记录的编译/汇编单元：{len(built_names)} 个；按文件名集合比较：`{'一致' if not missing_from_log and not extra_in_log else '不一致'}`。",
        f"- MAP 向量地址：`{hex(map_facts.get('vectors', 0))}`；HEX 数据起始地址：`{hex(hex_facts['min_address']) if hex_facts.get('min_address') is not None else '未知'}`；静态地址对齐：`{'是' if base_ok else '否'}`。",
        "- 这能支持“当前目录中存在一份与 target/历史 Build log 布局相容的构建证据”，不能支持“本次在当前环境重新编译并已在板上运行”。",
        "",
        "## C0–C4 证据节点",
        "",
        "| 节点 | 当前状态 | 允许的表述 | 仍缺什么 |",
        "|---|---|---|---|",
        "| C0 工程合同 | static pass | target、芯片、宏、源文件组、IROM/IRAM、输出规则可核对 | 当前 Keil/Pack 可用性 |",
        "| C1 产物身份 | static-compatible | target 文件名与历史 Build log 对齐，MAP/HEX 起始布局相容 | 同一次构建的完整输入 hash/当前环境重编译 |",
        "| C2 Flash | not-evidenced | 只能写下载配置/流程存在 | J-Link 或 ST-Link 会话、program/verify/readback |",
        "| C3 Reset/boot | not-evidenced | 只能写源码向量和启动链 | 复位后的 PC/MSP/VTOR、断点到 main |",
        "| C4 runtime | not-evidenced | 只能写 UART/LCD/任务代码路径 | 原始串口、LCD、业务输入输出和时间戳 |",
        "",
        "## 关键矛盾与边界",
        "",
        f"- 历史 Build log 的项目路径：`{rtos['build_log']['reported_project'] or '未记录'}`；它包含 Windows 绝对路径，且不是当前 iCloud vault 路径。",
        f"- `TargetStatus/InvalidFlash`：`{config['invalid_flash_flag'] or '未记录'}`；J-Link `Device`：`{settings.get('Device', '未记录')}`；工程 target DLL：`{config['target_dll'] or '未记录'}`。这三项是配置线索，不是连接结果。",
        f"- Build log 报告：`{rtos['build_log']['program_size'] or '未记录'}`，错误/警告：`{rtos['build_log']['errors']}/{rtos['build_log']['warnings']}`；这是历史日志内容，不自动证明当前源文件未变化。",
        "- `0x08000000` 的主工程布局与 `FLASH_APP1_ADDR=0x0800F000` 的 IAP 规划不能混为一谈；当前报告不把后者当作独立 APP 链接证据。",
        "",
        "## 可执行补证步骤",
        "",
        "1. 在同一 Keil target 执行 Rebuild，保存完整 log、工具/Pack 版本和 AXF/HEX/MAP/SCT 的 SHA-256。",
        "2. 记录实际送入下载器的文件路径和 hash，执行 program + verify + readback；避免未经确认的整片擦除覆盖 Boot 内容。",
        "3. 复位后记录向量首两个 word、PC/MSP/VTOR，并在 `Reset_Handler`、`main` 和业务断言处取证。",
        "4. 记录 `DEBUG`/`SENSOR_DEBUG`/`ifopen` 变体、UART 接线和原始输出；将“Build succeeded”“Flash verified”“reached main”“business observed”分开报告。",
        "",
        "## 来源",
        "",
    ]
    lines.extend(f"- `{source}`" for source in rtos["source_files"])
    return rtos, lines


def python_syntax(path: Path) -> dict[str, Any]:
    try:
        compile(read(path), str(path), "exec")
        return {"syntax": "pass"}
    except SyntaxError as exc:
        return {"syntax": "error", "error": str(exc)}


def parse_memory() -> dict[str, Any]:
    root = VAULT / "projects/Linux物理内存检测项目/源码"
    user = root / "exfrag_user.py"
    bridge = root / "exfrag.py"
    state = root / "fraginfo.c"
    event = root / "extfraginfo.c"
    user_text, bridge_text, state_text, event_text = map(read, (user, bridge, state, event))
    import_name = re.search(r"^from\s+([A-Za-z_][\w]*)\s+import\s+ExtFrag", user_text, re.MULTILINE)
    bpf_import = re.search(r"^from\s+([A-Za-z_][\w]*)\s+import\s+BPF", bridge_text, re.MULTILINE)
    bpf_paths = re.findall(r"BPF\(src_file\s*=\s*[\"']([^\"']+)", bridge_text)
    resolved_bpf = [(root / path).resolve() for path in bpf_paths]
    syntax = {rel(path): python_syntax(path) for path in (user, bridge)}
    imports = {
        "user_import": import_name.group(1) if import_name else None,
        "user_import_target_exists": (root / f"{import_name.group(1)}.py").is_file() if import_name else False,
        "bridge_bpf_import": bpf_import.group(1) if bpf_import else None,
        "bridge_bpf_local_module_exists": (root / f"{bpf_import.group(1)}.py").is_file() if bpf_import else False,
    }
    bpf_source_records = [
        {
            "runtime_literal": path,
            "resolved_from_source_dir": rel(resolved) if resolved.is_relative_to(VAULT) else str(resolved),
            "exists_from_source_dir": resolved.is_file(),
        }
        for path, resolved in zip(bpf_paths, resolved_bpf)
    ]
    memory = {
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "source_files": [rel(path) for path in (user, bridge, state, event)],
        "syntax": syntax,
        "imports": imports,
        "bpf_source_paths": bpf_source_records,
        "probe_contracts": {
            "state_probe": "kprobe__get_page_from_freelist" in state_text,
            "event_probe": "TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)" in event_text,
            "state_maps": sorted(re.findall(r"BPF_(?:HASH|ARRAY)\((\w+)", state_text)),
            "event_maps": sorted(re.findall(r"BPF_(?:HASH|ARRAY)\((\w+)", event_text)),
        },
        "static_findings": {
            "state_delay_lookup_key_is_current_time": "last_time_map.lookup(&current_time)" in state_text,
            "state_updates_last_time": "last_time_map.update(&current_time, &current_time)" in state_text,
            "event_delay_lookup_key_is_current_time": "last_time_map.lookup(&current_time)" in event_text,
            "event_updates_last_time": "last_time_map.update" in event_text,
            "event_delay_default_assignment_present": bool(re.search(r"int\s+delay\s*=", event_text)),
            "event_pid_aggregation": "BPF_HASH(counts_map, pid_t" in event_text,
            "event_read_modify_write": "data->count += 1" in event_text and "counts_map.update(&pid, data)" in event_text,
            "user_reads_count_map": 'self.b["counts_map"]' in bridge_text,
            "user_reads_zone_map": 'self.b["zone_map"]' in bridge_text,
        },
        "validation_matrix": [
            {"id": "M0", "check": "Python source syntax", "status": "pass" if all(v.get("syntax") == "pass" for v in syntax.values()) else "blocked", "evidence": "compile() in memory; no .pyc written"},
            {"id": "M1", "check": "user import resolves", "status": "blocked" if imports["user_import_target_exists"] is False else "static-pass", "evidence": f"from {imports['user_import'] or '(missing)'} import ExtFrag"},
            {"id": "M2", "check": "BCC module import", "status": "environment-dependent", "evidence": f"from {imports['bridge_bpf_import'] or '(missing)'} import BPF; package not executed"},
            {"id": "M3", "check": "BPF C source path", "status": "blocked" if any(not item["exists_from_source_dir"] for item in bpf_source_records) else "static-pass", "evidence": "BPF(src_file=...) literals resolved from source directory"},
            {"id": "M4", "check": "BCC/Clang compile and verifier", "status": "not-run", "evidence": "requires target Linux/BCC/kernel headers"},
            {"id": "M5", "check": "probe attach and event trigger", "status": "not-run", "evidence": "requires target kernel, permissions and workload"},
            {"id": "M6", "check": "Map update/read/display", "status": "not-run", "evidence": "requires attached probe and curses session"},
            {"id": "M7", "check": "sampling throttle behavior", "status": "static-risk", "evidence": "current-time key; event path has no update and delay may be unset"},
            {"id": "M8", "check": "counter accuracy under concurrency", "status": "not-run", "evidence": "PID hash RMW path; no multi-CPU experiment"},
        ],
    }
    lines = [
        "# Linux 物理内存/eBPF 可运行性验证矩阵",
        "",
        "> 这是源码级执行前检查，不是对目标 Linux 内核/BCC 的运行报告。原始 `projects/Linux物理内存检测项目/源码/` 保持只读。",
        "",
        "## 立即暴露的静态阻断",
        "",
        f"- 用户入口导入：`from {memory['imports']['user_import'] or '(missing)'} import ExtFrag`；同目录可见的实现文件是 `exfrag.py`，导入目标存在：`{'是' if memory['imports']['user_import_target_exists'] else '否'}`。",
        f"- BCC 源文件路径：{', '.join('`' + item['runtime_literal'] + '`' for item in memory['bpf_source_paths'])}；从源码目录解析均存在：`{'是' if all(item['exists_from_source_dir'] for item in memory['bpf_source_paths']) else '否'}`。实际代码文件位于 `源码/fraginfo.c` 和 `源码/extfraginfo.c`，不是 `源码/bpf/` 子目录。",
        "- 这两个问题需要在目标环境运行前修复或确认启动目录/模块别名；本轮没有修改原始代码，也没有把它们伪装成已运行。",
        "",
        "## 验证矩阵",
        "",
        "| ID | 检查 | 状态 | 当前证据/缺口 |",
        "|---|---|---|---|",
    ]
    for row in memory["validation_matrix"]:
        lines.append(f"| {row['id']} | {row['check']} | **{row['status']}** | {row['evidence']} |")
    lines += [
        "",
        "## 当前源码合同",
        "",
        "- `fraginfo.c`：`kprobe__get_page_from_freelist` 入口采样，读取 `alloc_context`/zone 状态，写 `pgdat_map`/`zone_map`；没有返回点、请求 ID 或最终分配结果。",
        "- `extfraginfo.c`：`mm_page_alloc_extfrag` tracepoint，按 PID 写 `counts_map`；`count` 累计而 PFN/order/comm 覆盖为最近值，不是事件时间线。",
        "- 两个探针都以 `current_time` 作为 `last_time_map` lookup key；事件程序没有 `last_time_map.update()`，且 `delay` 在 map lookup 失败时没有显式默认值。静态上应报告为节流风险，不能报告实际丢失率。",
        "- `exfrag.py` 的 TUI 刷新间隔与内核采样/事件接受频率是不同层次；不能用界面刷新证明探针采样准确。",
        "",
        "## 目标机补证顺序",
        "",
        "1. 先修复/确认 import 名称、BPF C 文件路径和当前工作目录；记录修复后的变体 hash。",
        "2. 在目标内核执行 BCC 编译、verifier 和 attach；分别记录 tracepoint/kprobe attach 结果。",
        "3. 用受控 workload 验证 Map 是否更新，再分别核对 zone 快照、PID 聚合和 curses 读取。",
        "4. 用独立 tracepoint 计数或内核统计对照 `counts_map`，在多 CPU/并发、PID 复用和读取期间更新的条件下测量合同，而不是默认精确。",
        "",
        "## 来源",
        "",
    ]
    lines.extend(f"- `{source}`" for source in memory["source_files"])
    return memory, lines


def parse_cmake_sources(path: Path) -> dict[str, Any]:
    text = read(path) if path.is_file() else ""
    matches = re.findall(r"add_executable\s*\(\s*([^\s\)]+)\s+([^\)]+)\)", text, re.IGNORECASE | re.DOTALL)
    targets = []
    for target, source_text in matches:
        # Match longer C++ extensions before ``.c``.  The previous alternation
        # could turn ``main.cpp`` into ``main.c`` because the regex engine
        # accepted the shorter suffix first; that polluted provenance reports
        # without touching the source tree.
        sources = re.findall(r"[A-Za-z0-9_+./-]+\.(?:cpp|cxx|cc|c)", source_text)
        targets.append({"target": target, "sources": sources})
    return {"path": rel(path), "targets": targets}


def parse_vision() -> dict[str, Any]:
    vision = VAULT / "projects/linux视觉感知项目"
    mainwindow = vision / "源码/上位机程序/Lane_Detection/mainwindow.cpp"
    mainwindow_h = vision / "源码/上位机程序/Lane_Detection/mainwindow.h"
    lstr = vision / "源码/上位机程序/Lane_Detection/LSTR/main.cpp"
    lstr_cmake = vision / "源码/上位机程序/Lane_Detection/LSTR/CMakeLists.txt"
    lime = vision / "源码/图像预处理（加速前+加速后）/Lime/CMakeLists.txt"
    lime_opt = vision / "源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/CMakeLists.txt"
    lstr_onnx = vision / "源码/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp"
    lstr_onnx_cmake = vision / "源码/卷积神经网络/卷积神经网络/LSTR_ONNX/CMakeLists.txt"
    unet = vision / "源码/卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp"
    unet_cmake = vision / "源码/卷积神经网络/卷积神经网络/Unet_NCNN/CMakeLists.txt"
    build_files = [
        vision / "源码/上位机程序/Lane_Detection/LSTR/build/CMakeCache.txt",
        vision / "源码/上位机程序/Lane_Detection/LSTR/build/CMakeFiles/LSTR.dir/DependInfo.cmake",
        vision / "源码/上位机程序/Lane_Detection/LSTR/build/CMakeFiles/LSTR.dir/build.make",
        vision / "源码/上位机程序/Lane_Detection/LSTR/build/CMakeFiles/LSTR.dir/link.txt",
        vision / "源码/图像预处理（加速前+加速后）/Lime/build/CMakeCache.txt",
        vision / "源码/图像预处理（加速前+加速后）/Lime/build/CMakeFiles/lime.dir/DependInfo.cmake",
        vision / "源码/图像预处理（加速前+加速后）/Lime/build/CMakeFiles/lime.dir/build.make",
        vision / "源码/图像预处理（加速前+加速后）/Lime/build/CMakeFiles/lime.dir/link.txt",
        vision / "源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/CMakeCache.txt",
        vision / "源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/CMakeFiles/lime.dir/DependInfo.cmake",
        vision / "源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/CMakeFiles/lime.dir/build.make",
        vision / "源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/CMakeFiles/lime.dir/link.txt",
        vision / "源码/卷积神经网络/卷积神经网络/LSTR_ONNX/build/CMakeCache.txt",
        vision / "源码/卷积神经网络/卷积神经网络/LSTR_ONNX/build/CMakeFiles/LSTR.dir/DependInfo.cmake",
        vision / "源码/卷积神经网络/卷积神经网络/LSTR_ONNX/build/CMakeFiles/LSTR.dir/build.make",
        vision / "源码/卷积神经网络/卷积神经网络/LSTR_ONNX/build/CMakeFiles/LSTR.dir/link.txt",
        vision / "源码/卷积神经网络/卷积神经网络/Unet_NCNN/build/CMakeCache.txt",
        vision / "源码/卷积神经网络/卷积神经网络/Unet_NCNN/build/CMakeFiles/unet_ncnn.dir/DependInfo.cmake",
        vision / "源码/卷积神经网络/卷积神经网络/Unet_NCNN/build/CMakeFiles/unet_ncnn.dir/build.make",
        vision / "源码/卷积神经网络/卷积神经网络/Unet_NCNN/build/CMakeFiles/unet_ncnn.dir/link.txt",
    ]
    main_text, header_text, lstr_text = map(read, (mainwindow, mainwindow_h, lstr))
    lstr_onnx_text = read(lstr_onnx)
    unet_text = read(unet)
    camera_write = re.findall(r'imwrite\("([^"]*frames/[^"+]*)"\s*\+\s*to_string\(count\)', main_text)
    result_read = re.findall(r'imread\("([^"]*result/[^"+]*)"\s*\+\s*to_string\(i\)', main_text)
    ffmpeg_path = re.findall(r'process3->write\("cd ([^"\\]+)', main_text)
    ffmpeg_command = re.findall(r'process3->write\("(ffmpeg[^"\\]+)', main_text)
    inference_command = re.findall(r'process2->write\("(\.\/LSTR[^"\\]+)', main_text)
    lstr_input = re.findall(r'imread\(filefolderpath\s*\+\s*to_string\(i\)\s*\+\s*"\.jpg"', lstr_text)
    model_path = re.search(r'model_path\s*=\s*"([^"]+lstr_[^"]+\.onnx)"', lstr_text)
    log_path = re.search(r'fopen\("([^"]*log_space\.bin)"', lstr_text)
    standalone_model_path = re.search(r'model_path\s*=\s*"([^"]+lstr_[^"]+\.onnx)"', lstr_onnx_text)
    standalone_log_path = re.search(r'fopen\("([^"]*log_space\.bin)"', lstr_onnx_text)
    standalone_input_path = re.search(r'string\s+imgpath\s*=\s*"([^"]+)"', lstr_onnx_text)
    standalone_output_path = re.search(r'imwrite\("([^"]+)"', lstr_onnx_text)
    unet_model_paths = re.findall(r'load_(?:param|model)\("([^"]+)"\)', unet_text)
    unet_input_from_argv = bool(re.search(r'imread\(argv\[1\]\)', unet_text))
    unet_output_path = re.search(r'imwrite\("([^"]+)"', unet_text)
    qprocess_parentless = bool(re.search(r'process[23]\s*=\s*new\s+QProcess\s*;', main_text))
    destructor = re.search(r'MainWindow::~MainWindow\(\)(.*?)(?=\n\})', main_text, re.DOTALL)
    lifecycle_signals = {
        signal: bool(re.search(signal, main_text))
        for signal in (r'finished\s*\(', r'errorOccurred\s*\(', r'readyReadStandardError', r'waitForFinished', r'->terminate\s*\(', r'->kill\s*\(')
    }
    cmake = [parse_cmake_sources(path) for path in (lstr_cmake, lime, lime_opt, lstr_onnx_cmake, unet_cmake)]
    independent_target_specs = [
        {
            "name": "LSTR_ONNX",
            "cmake": lstr_onnx_cmake,
            "source_root": lstr_onnx.parent,
            "expected_target": "LSTR",
            "executable": lstr_onnx.parent / "build/LSTR",
        },
        {
            "name": "Unet_NCNN",
            "cmake": unet_cmake,
            "source_root": unet_cmake.parent,
            "expected_target": "unet_ncnn",
            "executable": unet_cmake.parent / "build/unet_ncnn",
        },
    ]
    independent_targets = []
    for spec in independent_target_specs:
        parsed = parse_cmake_sources(spec["cmake"])
        target = next(
            (item for item in parsed["targets"] if item["target"] == spec["expected_target"]),
            None,
        )
        declared_sources = target["sources"] if target else []
        resolved_sources = [spec["source_root"] / source for source in declared_sources]
        independent_targets.append(
            {
                "name": spec["name"],
                "cmake": rel(spec["cmake"]),
                "expected_target": spec["expected_target"],
                "target_found": target is not None,
                "declared_sources": declared_sources,
                "resolved_sources": [rel(path) for path in resolved_sources],
                "all_declared_sources_exist": bool(resolved_sources) and all(path.is_file() for path in resolved_sources),
                "build_executable": file_record(spec["executable"]),
            }
        )
    current_xinlime = vision / "源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/xinlime.cpp"
    stale_paths = []
    for path in build_files:
        if path.is_file() and "/media/kylin/" in read(path):
            stale_paths.append(rel(path))
    model = vision / "源码/上位机程序/Lane_Detection/LSTR/lstr_360x640.onnx"
    log_space = vision / "源码/上位机程序/Lane_Detection/LSTR/log_space.bin"
    standalone_model = lstr_onnx.parent / "lstr_360x640.onnx"
    standalone_log_space = lstr_onnx.parent / "log_space.bin"
    standalone_onnx_runtime = lstr_onnx.parent / "lib/libonnxruntime.so"
    unet_param = unet_cmake.parent / "models/model.ncnn.param"
    unet_bin = unet_cmake.parent / "models/model.ncnn.bin"
    unet_ncnn_library = unet_cmake.parent / "lib/libncnn.a"
    standalone_lstr_model_from_build = (lstr_onnx.parent / "build" / (standalone_model_path.group(1) if standalone_model_path else "")).resolve()
    standalone_lstr_log_from_build = (lstr_onnx.parent / "build" / (standalone_log_path.group(1) if standalone_log_path else "")).resolve()
    unet_models_from_build = [
        (unet_cmake.parent / "build" / model_path).resolve()
        for model_path in unet_model_paths
    ]
    independent_branches = {
        "LSTR_ONNX": {
            "source_files": [rel(lstr_onnx_cmake), rel(lstr_onnx)],
            "asset_records": {
                "model": file_record(standalone_model),
                "log_space": file_record(standalone_log_space),
                "onnxruntime_shared_library": file_record(standalone_onnx_runtime),
            },
            "runtime_literals": {
                "model_path": standalone_model_path.group(1) if standalone_model_path else None,
                "log_space_path": standalone_log_path.group(1) if standalone_log_path else None,
                "input_image": standalone_input_path.group(1) if standalone_input_path else None,
                "output_image": standalone_output_path.group(1) if standalone_output_path else None,
            },
            "static_findings": {
                "target_source_membership": independent_targets[0]["target_found"] and independent_targets[0]["all_declared_sources_exist"],
                "model_path_resolves_from_build": standalone_lstr_model_from_build.is_file() if standalone_model_path else False,
                "log_space_path_resolves_from_build": standalone_lstr_log_from_build.is_file() if standalone_log_path else False,
                "runtime_library_present": standalone_onnx_runtime.is_file(),
                "runtime_discovers_input_and_output_metadata": "GetInputTypeInfo" in lstr_onnx_text and "GetOutputTypeInfo" in lstr_onnx_text,
                "uses_two_input_tensors": "ort_inputs.data(), 2" in lstr_onnx_text,
                "model_file_handle_checked": "if (fp" in lstr_onnx_text,
                "arm_neon_header_in_source": "<arm_neon.h>" in lstr_onnx_text,
            },
        },
        "Unet_NCNN": {
            "source_files": [rel(unet_cmake), rel(unet)],
            "asset_records": {
                "param": file_record(unet_param),
                "bin": file_record(unet_bin),
                "ncnn_static_library": file_record(unet_ncnn_library),
            },
            "runtime_literals": {
                "param_path": unet_model_paths[0] if len(unet_model_paths) > 0 else None,
                "bin_path": unet_model_paths[1] if len(unet_model_paths) > 1 else None,
                "input_argument": "argv[1]" if unet_input_from_argv else None,
                "output_image": unet_output_path.group(1) if unet_output_path else None,
            },
            "static_findings": {
                "target_source_membership": independent_targets[1]["target_found"] and independent_targets[1]["all_declared_sources_exist"],
                "model_paths_resolve_from_build": bool(unet_models_from_build) and all(path.is_file() for path in unet_models_from_build),
                "ncnn_library_present": unet_ncnn_library.is_file(),
                "openmp_declared_in_cmake": "find_package(OpenMP" in read(unet_cmake),
                "four_threads_requested": "set_num_threads(4)" in unet_text,
                "input_is_command_line_argument": unet_input_from_argv,
                "input_file_open_result_checked": "src.empty()" in unet_text or "!src" in unet_text,
            },
        },
    }
    input_path_from_build = "/home/kylin/桌面/project_v1.0/LSTR/videos/frames/"
    camera_path = camera_write[0] if camera_write else None
    vision_data = {
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "source_files": [
            rel(path)
            for path in (
                mainwindow,
                mainwindow_h,
                lstr,
                lstr_cmake,
                lime,
                lime_opt,
                lstr_onnx,
                lstr_onnx_cmake,
                unet,
                unet_cmake,
            )
        ],
        "paths": {
            "camera_write_literals": camera_write,
            "result_read_literals": result_read,
            "ffmpeg_cd_literals": ffmpeg_path,
            "ffmpeg_commands": ffmpeg_command,
            "inference_command": inference_command,
            "inference_expected_input_from_build_cwd": input_path_from_build,
            "lstr_model_relative_path": model_path.group(1) if model_path else None,
            "lstr_log_space_relative_path": log_path.group(1) if log_path else None,
        },
        "lifecycle": {
            "qprocess_parentless": qprocess_parentless,
            "destructor_text": destructor.group(1).strip() if destructor else None,
            "signals_or_cleanup_found": lifecycle_signals,
            "main_header_has_qprocess_members": "QProcess" in header_text,
        },
        "cmake": cmake,
        "independent_targets": independent_targets,
        "independent_branches": independent_branches,
        "build_evidence": {
            "stale_absolute_path_files": stale_paths,
            "current_xinlime_exists": current_xinlime.is_file(),
            "model_exists": model.is_file(),
            "log_space_exists": log_space.is_file(),
            "independent_asset_records": {
                name: branch["asset_records"] for name, branch in independent_branches.items()
            },
            "artifact_records": [file_record(path) for path in build_files],
        },
        "static_findings": {
            "camera_and_inference_paths_match": bool(camera_path and input_path_from_build.startswith(camera_path)),
            "camera_writes_count_from_zero": "count = 0" in main_text,
            "camera_increments_after_write": bool(re.search(r'imwrite\([\s\S]*?\n\s*//统计图片数量\s*\n\s*count\s*\+\+', main_text)),
            "lstr_reads_from_one": "for(int i = 1; i < INT_MAX; i++)" in lstr_text,
            "mainwindow_reads_results_from_one": "for(int i = 1; i < INT_MAX; i++)" in main_text,
            "ui_slot_has_ten_second_wait": "waitKey(10000)" in main_text,
            "ui_slot_polls_synchronously": "for(int i = 1; i < INT_MAX; i++)" in main_text and "imread" in main_text,
            "base_lime_target_source": "lime.cpp" in read(lime),
            "optimized_lime_target_source": "lime_opt.cpp" in read(lime_opt),
            "xinlime_in_optimized_cmake": "xinlime.cpp" in read(lime_opt),
            "build_tree_uses_old_absolute_paths": bool(stale_paths),
        },
        "validation_matrix": [],
    }
    mismatch = not vision_data["static_findings"]["camera_and_inference_paths_match"]
    vision_data["validation_matrix"] = [
        {"id": "V0", "check": "source membership", "status": "static-pass" if all(item["target_found"] and item["all_declared_sources_exist"] for item in independent_targets) else "static-blocked", "evidence": "main/LIME plus LSTR_ONNX and Unet_NCNN CMake target source lists parsed"},
        {"id": "V1", "check": "camera frame write reaches inference input", "status": "static-blocked" if mismatch else "static-compatible", "evidence": f"camera={camera_path or '(missing)'}; inference={input_path_from_build}"},
        {"id": "V2", "check": "frame numbering contract", "status": "static-risk" if vision_data["static_findings"]["camera_writes_count_from_zero"] and vision_data["static_findings"]["lstr_reads_from_one"] else "needs-review", "evidence": "camera count starts at 0; LSTR loop starts at 1"},
        {"id": "V3", "check": "QProcess completion/error/cancel lifecycle", "status": "static-risk" if qprocess_parentless and not any(lifecycle_signals.values()) else "needs-review", "evidence": "parent/finished/error/timeout/termination must be checked"},
        {"id": "V4", "check": "GUI event-loop responsiveness", "status": "static-risk" if vision_data["static_findings"]["ui_slot_has_ten_second_wait"] and vision_data["static_findings"]["ui_slot_polls_synchronously"] else "needs-review", "evidence": "blocking wait and synchronous result loop occur in slot"},
        {"id": "V5", "check": "current CMake/build provenance", "status": "historical-only" if stale_paths else "static-pass", "evidence": f"old absolute build paths in {len(stale_paths)} generated files"},
        {"id": "V6", "check": "model file and tensor metadata", "status": "partial-static" if model.is_file() and standalone_model.is_file() and unet_param.is_file() and unet_bin.is_file() else "blocked", "evidence": "main, LSTR_ONNX and Unet_NCNN model/helper files are inventoried; file presence is not shape/dtype/runtime validation"},
        {"id": "V7", "check": "ARM/NEON/OpenMP performance", "status": "not-run", "evidence": "requires target AArch64/NEON and benchmark harness"},
        {"id": "V8", "check": "Qt/OpenCV buffer ownership and display", "status": "not-run", "evidence": "requires target Qt/OpenCV and known-pixel/non-contiguous Mat tests"},
    ]
    lines = [
        "# Linux 视觉主链核验矩阵",
        "",
        "> 该矩阵把“摄像头/文件输入 → 帧文件 → LSTR/预处理 → 结果文件 → Qt 显示”拆开核对。源码、模型和构建树只读；没有在目标 ARM/Qt/OpenCV 环境执行。",
        "",
        "## 静态主链结论",
        "",
        f"- 摄像头保存路径：`{camera_path or '未识别'}`；Qt 启动的 LSTR 输入路径（按构建 cwd 展开）：`{input_path_from_build}`；默认不一致：`{'是' if mismatch else '否'}`。",
        "- 摄像头计数器在 `on_Open_triggered()` 设为 0，`readFrame()` 先写 `count` 再递增；LSTR 的读取循环从 1 开始。它是静态编号边界，不能自动推断所有场景必然失败。",
        f"- QProcess 以无 parent 形式创建：`{'是' if qprocess_parentless else '否'}`；finished/error/stderr/timeout/terminate/kill 连接或调用命中：`{sum(lifecycle_signals.values())}` 项。",
        f"- 现有构建树包含旧 `/media/kylin/...` 绝对路径的生成文件：{len(stale_paths)} 个；可证明历史 configure/build 线索，不能证明当前 iCloud 源码已经重建。",
        "",
        "## 验证矩阵",
        "",
        "| ID | 检查 | 状态 | 当前证据/缺口 |",
        "|---|---|---|---|",
    ]
    for row in vision_data["validation_matrix"]:
        lines.append(f"| {row['id']} | {row['check']} | **{row['status']}** | {row['evidence']} |")
    lines += [
        "",
        "## 分支身份",
        "",
        "- 基线 LIME target 是 `lime`，源文件为 `lime.cpp`；优化 LIME target 也叫 `lime`，源文件为 `lime_opt.cpp`。两套 build 目录不能只靠可执行文件名区分。",
        f"- `xinlime.cpp` 当前存在：`{'是' if current_xinlime.is_file() else '否'}`；优化 CMake 是否把它列入 target：`{'是' if vision_data['static_findings']['xinlime_in_optimized_cmake'] else '否'}`。",
        f"- LSTR 模型文件存在：`{'是' if model.is_file() else '否'}`；`log_space.bin` 存在：`{'是' if log_space.is_file() else '否'}`。文件存在不等于输入 shape、dtype、输出顺序和主链已运行验证。",
        f"- 独立 `LSTR_ONNX` target：`{'已识别且源文件存在' if independent_branches['LSTR_ONNX']['static_findings']['target_source_membership'] else '需要复核'}`；其模型/`log_space.bin` 从 `build/` 相对路径解析：`{'是' if independent_branches['LSTR_ONNX']['static_findings']['model_path_resolves_from_build'] and independent_branches['LSTR_ONNX']['static_findings']['log_space_path_resolves_from_build'] else '否'}`；ONNX Runtime 共享库存在：`{'是' if independent_branches['LSTR_ONNX']['static_findings']['runtime_library_present'] else '否'}`。",
        f"- 独立 `Unet_NCNN` target：`{'已识别且源文件存在' if independent_branches['Unet_NCNN']['static_findings']['target_source_membership'] else '需要复核'}`；其 `model.ncnn.param/bin` 从 `build/` 相对路径解析：`{'是' if independent_branches['Unet_NCNN']['static_findings']['model_paths_resolve_from_build'] else '否'}`；`libncnn.a` 存在：`{'是' if independent_branches['Unet_NCNN']['static_findings']['ncnn_library_present'] else '否'}`。",
        "- 这两个独立分支只能证明源码、配置、模型/库和历史构建文件的静态关系；不能据此宣称当前机器或目标板完成了推理、输出质量或性能验证。",
        "",
        "## 目标环境补证顺序",
        "",
        "1. 统一输入/输出根目录和帧完成合同：明确摄像头、ffmpeg、LSTR 和 Qt 四方的实际路径、编号起点、原子落盘/完成标志和旧结果清理。",
        "2. 在当前源码目录 clean configure/build，保存 CMake source/build directory、target source、compile/link command、架构和动态库 loader 证据。",
        "3. 对主链 LSTR、独立 LSTR_ONNX 和 Unet_NCNN 分别用一个已知图片验证模型加载、输入 shape/dtype、输出 shape/类别映射和结果文件；不能用一个分支的输出替代另一个分支的证据。",
        "4. 用已知像素和非连续 Mat 验证 Mat→QImage→QPixmap 所有权、stride、颜色顺序；最后在目标板测 NEON/OpenMP/NCNN 线程配置性能并保存原始 benchmark。",
        "",
        "## 来源",
        "",
    ]
    lines.extend(f"- `{source}`" for source in vision_data["source_files"])
    return vision_data, lines


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-only", action="store_true", help="read and validate, but do not write reports")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    reports = [parse_rtos(), parse_memory(), parse_vision()]
    if not args.check_only:
        write_report("rtos-project", "artifact-provenance", reports[0][0], reports[0][1])
        write_report("linux-memory-ebpf", "runtime-validation-matrix", reports[1][0], reports[1][1])
        write_report("linux-vision", "main-chain-verification-matrix", reports[2][0], reports[2][1])
    summary = {
        "rtos": reports[0][0]["static_assessment"],
        "linux_memory": {row["id"]: row["status"] for row in reports[1][0]["validation_matrix"]},
        "linux_vision": {row["id"]: row["status"] for row in reports[2][0]["validation_matrix"]},
        "wrote_reports": not args.check_only,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
