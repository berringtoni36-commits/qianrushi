# AGENTS.md

This is a STM32F103C8T6 + FreeRTOS embedded motor control project. Use Chinese for all communication.

## Project overview

- **MCU**: STM32F103C8T6 (Cortex-M3)
- **RTOS**: FreeRTOS
- **IDE**: Keil MDK (UV5)
- **Main features**: PWM dead-time motor control, encoder speed measurement, PID speed regulation, MQ2 gas sensor monitoring, LCD display, UART+DMA communication, IAP firmware upgrade with CRC32 verification

## Directory structure

| Directory | Purpose |
|---|---|
| `CORE/` | CMSIS core files + startup assembly (`core_cm3.c`, `startup_stm32f10x_hd.s`) |
| `BSP/` | Hardware drivers organized by peripheral (MOTOR, PID, KEY, LCD, MQ2, DMA, SPI, IAP, CRC32, BEEP, DHT11, GPIO, STMFLASH, WIND) |
| `STM32F10x_FWLib/` | STM32 standard peripheral library (`inc/` headers, `src/` implementations) |
| `FreeRTOS/` | FreeRTOS kernel source (`tasks.c`, `queue.c`, `list.c`, `croutine.c`, `event_groups.c`) + port layer for ARM_CM3 + heap_4 memory manager |
| `SYSTEM/` | Serial port and delay drivers |
| `USER/` | Keil project files + `main.c`, `main.h`, interrupt handlers, system init |
| `APP_TASK/` | Application-layer task source files (`app_tasks.c/.h`) |
| `OBJ/` | Build output / compiled object files |
| `tools/` | Python scripts (`add_crc32.py`) + original and CRC-processed firmware bins |

## Main application flow (from `USER/main.c`)

1. `Hardware_Init()` - NVIC priority group 4, delay init, TIM1 PWM (1kHz with dead-time), TIM2 encoder, buzzer, keys, MQ2 sensor, PID (Kp=14.0, Ki=1.65, Kd=0.0), wind speed algorithm, LCD, UART1 (115200), DMA1_CH5
2. `System_Init()` - system state initialization
3. `StartTask_Create()` - create FreeRTOS application tasks
4. `vTaskStartScheduler()` - start FreeRTOS scheduler

## Coding conventions

- C language, Keil MDK compiler (ARMCC)
- BSP drivers are modular: each peripheral gets its own `.c/.h` pair under `BSP/<name>/`
- FreeRTOS tasks are created in `APP_TASK/app_tasks.c`
- Standard peripheral library naming: `STM32F10x_FWLib`

## Behavior rules

- Never modify `OBJ/` compiled output files
- Before suggesting firmware changes, confirm the target peripheral and its BSP driver
- When explaining embedded concepts, use this RTOS project code as real examples
- 用中文回答

## 学习工作流说明

- 仅在学习本 RTOS 油烟机项目时，先读取并使用 `.codex/skills/project-learning/SKILL.md`。
- 该 skill 的来源文件已整理为标准入口：`.codex/skills/project-learning/SKILL.md`，以后不再使用旧文件名 `rtos-project-learning-SKILL.md` 作为入口。
- 当该 skill 要求参考项目文档时，同步读取：
  - `.codex/references/rtos项目开发文档_详细图解版.md`
  - `.codex/references/rtos项目高频面试点.md`
- 该 skill 仅用于本 RTOS 项目学习，不作为其他项目学习的通用默认 skill。
