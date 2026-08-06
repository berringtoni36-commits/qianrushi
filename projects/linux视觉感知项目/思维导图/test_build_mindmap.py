import sys
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
PROJECT_DIR = HERE.parent
VAULT_DIR = PROJECT_DIR.parent.parent
sys.path.insert(0, str(HERE))

import build_mindmap  # noqa: E402


class MindMapBuildTests(unittest.TestCase):
    def test_tree_uses_only_project_eightfold_section(self):
        tree = build_mindmap.build_tree(PROJECT_DIR)
        markdown = build_mindmap.render_markdown(tree)

        self.assertIn("# Linux视觉感知项目｜快速复习思维导图", markdown)
        self.assertIn("## 9. 项目八股｜原作者学习指南第 3.2–3.8 节", markdown)
        self.assertIn("如何复现 LIME 算法", markdown)
        self.assertIn("为什么不用 GPU 加速", markdown)
        self.assertIn("循环重排", markdown)
        self.assertIn("Cacheline", markdown)
        self.assertIn("Perf", markdown)

        self.assertNotIn("RTOS", markdown.upper())
        self.assertNotIn("FREERTOS", markdown.upper())
        self.assertNotIn("简历描述与面试介绍", markdown)
        self.assertNotIn("项目开发过程", markdown)
        self.assertNotIn("学习网站", markdown)
        self.assertNotIn("3.1 情况介绍", markdown)
        self.assertNotIn("4.5.1 模型部署流程", markdown)

    def test_core_project_branches_and_keywords_are_present(self):
        tree = build_mindmap.build_tree(PROJECT_DIR)
        markdown = build_mindmap.render_markdown(tree)

        for branch in (
            "项目定位与硬件平台",
            "系统架构与完整数据流",
            "Qt 上位机",
            "LIME 算法原理",
            "NEON、OpenMP 与缓存优化",
            "LSTR 与 Unet 模型部署",
            "系统集成与性能数据",
            "项目面试表达与设计权衡",
            "主动回忆、易错点与破坏测试",
        ):
            self.assertIn(branch, markdown)

        for keyword in (
            "FT2000/4",
            "ADMM",
            "NEON",
            "OpenMP",
            "Pthread",
            "Loop Reordering",
            "Loop Unrolling",
            "LSTR",
            "Unet",
            "NCNN",
            "HWC→CHW",
        ):
            self.assertIn(keyword, markdown)

    def test_markdown_is_xmind_safe_and_svg_has_real_nodes(self):
        tree = build_mindmap.build_tree(PROJECT_DIR)
        markdown = build_mindmap.render_markdown(tree)
        errors = build_mindmap.validate_markdown(markdown)

        self.assertEqual([], errors)
        self.assertLessEqual(build_mindmap.max_markdown_depth(markdown), 6)

        svg = build_mindmap.render_svg(tree)
        self.assertIn('<svg xmlns="http://www.w3.org/2000/svg"', svg)
        self.assertIn('data-title="Linux视觉感知项目｜快速复习思维导图"', svg)
        self.assertGreater(svg.count("data-node="), 80)


if __name__ == "__main__":
    unittest.main()
