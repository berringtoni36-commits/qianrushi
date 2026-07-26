# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r'C:\Users\11624\Desktop\Rtos项目\RTOS项目复习文档.md')
t = p.read_text(encoding='utf-8-sig')

old_block = '| \u4e3a\u4ec0\u4e48\u5199 g_systemState \u8981\u7528\u4e92\u65a5\u91cf\uff1f | \u591a\u4efb\u52a1\u540c\u65f6\u8bfb\u5199\u4f1a\u5bfc\u81f4\u6570\u636e\u4e0d\u4e00\u81f4\uff0c\u4e92\u65a5\u91cf\u4fdd\u8bc1\u540c\u4e00\u65f6\u95f4\u53ea\u6709\u4e00\u4e2a\u4efb\u52a1\u8bbf\u95ee |\n\n| \u7834\u574f\u6d4b\u8bd5\uff08\u9519\u8bef\u8bf4\u6cd5\uff09 | \u6b63\u786e\u8bf4\u6cd5 |\n|------|------|\n| DO \u548c AO \u90fd\u80fd\u7cbe\u786e\u6d4b\u91cf\u6d53\u5ea6 | DO \u53ea\u6709\u9ad8\u4f4e\u4e24\u79cd\u72b6\u6001\uff0c\u65e0\u6cd5\u91cf\u5316 |\n| 10000 \u6b21\u91c7\u6837\u7cbe\u5ea6\u4f1a\u597d\u5f88\u591a | \u4f1a\u8ba9\u51fd\u6570\u6267\u884c\u65f6\u95f4\u592a\u957f\uff0c\u4e25\u91cd\u5f71\u54cd\u5b9e\u65f6\u6027\uff0c\u7cbe\u5ea6\u63d0\u5347\u4e0d\u660e\u663e |\n| ADC \u6821\u51c6\u6bcf\u6b21\u8bfb\u53d6\u90fd\u8981\u505a | \u53ea\u9700\u521d\u59cb\u5316\u65f6\u505a\u4e00\u6b21\uff0c\u504f\u5dee\u5728\u4e00\u6b21\u4e0a\u7535\u671f\u95f4\u662f\u7a33\u5b9a\u7684 |\n\n---'

new_block = '| \u4e3a\u4ec0\u4e48\u5199 g_systemState \u8981\u7528\u4e92\u65a5\u91cf\uff1f | \u591a\u4efb\u52a1\u540c\u65f6\u8bfb\u5199\u4f1a\u5bfc\u81f4\u6570\u636e\u4e0d\u4e00\u81f4\uff0c\u4e92\u65a5\u91cf\u4fdd\u8bc1\u540c\u4e00\u65f6\u95f4\u53ea\u6709\u4e00\u4e2a\u4efb\u52a1\u8bbf\u95ee |\n\n---\n\n#### \u516d\u3001\u6570\u636e\u6d41\u56fe\n\n```mermaid\nflowchart LR\n    MQ2["MQ2 \u4f20\u611f\u5668<br/>AO \u8f93\u51fa"] -->|\u6a21\u62df\u7535\u538b 0~3.3V| PA4["PA4 \u5f15\u811a"]\n    PA4 --> ADC["ADC1 CH4<br/>12bit \u91c7\u6837"]\n    ADC -->|0~4095| MQ2_Get["MQ2_GetAdcValue()"]\n    MQ2_Get --> AVG["10\u6b21\u53d6\u5e73\u5747"]\n    AVG --> CALC["MQ2_GetGasConcentration()<br/>\u7535\u538b\u2192\u6d53\u5ea6\u6362\u7b97"]\n    CALC -->|gasValue| MUTEX["\u4e92\u65a5\u91cf\u4fdd\u62a4<br/>g_dataMutex"]\n    MUTEX --> STATE["g_systemState<br/>.gasConcentration"]\n    STATE --> WIND["WindSpeedTask<br/>\u8bfb\u53d6\u6d53\u5ea6\u2192\u98ce\u901f"]\n    STATE --> ANTI["AntiBackflowTask<br/>\u8bfb\u53d6\u6d53\u5ea6\u2192\u9632\u56de\u6d41\u5224\u65ad"]\n```\n\n---\n\n#### \u4e03\u3001\u77e5\u8bc6\u94fe\n\n```mermaid\nflowchart TB\n    K1["MQ2 \u6c14\u4f53\u4f20\u611f\u5668"] --> K2["ADC \u6a21\u6570\u8f6c\u6362\u539f\u7406"]\n    K2 --> K3["ADC \u521d\u59cb\u5316 5 \u6b65"]\n    K3 --> K4["ADC \u91c7\u6837 + \u591a\u6b21\u53d6\u5e73\u5747"]\n    K4 --> K5["\u7535\u538b\u2192\u6d53\u5ea6\u6362\u7b97\u516c\u5f0f"]\n    K5 --> K6["\u4e92\u65a5\u91cf\u4fdd\u62a4\u5171\u4eab\u6570\u636e"]\n    K6 --> K7["g_systemState \u72b6\u6001\u673a"]\n    K7 --> K8["WindSpeedTask / AntiBackflowTask"]\n    K6 -.->|\u9762\u8bd5\u9ad8\u9891\u8003\u70b9| K9["rtos\u9879\u76ee\u9ad8\u9891\u9762\u8bd5\u70b9.md<br/>8.1 \u4e92\u65a5\u91cf vs \u961f\u5217"]\n```\n\n> **\u9762\u8bd5\u9ad8\u9891\u8003\u70b9\u8be6\u89c1 rtos\u9879\u76ee\u9ad8\u9891\u9762\u8bd5\u70b9.md**\uff088.1 \u4e3a\u4ec0\u4e48\u4f7f\u7528\u4e92\u65a5\u91cf\u30018.2 \u4e3a\u4ec0\u4e48\u4e0d\u91c7\u7528\u961f\u5217\uff09\n\n---'

if old_block in t:
    t2 = t.replace(old_block, new_block, 1)
    p.write_text(t2, encoding='utf-8-sig')
    print('OK')
else:
    print('NOT FOUND')
    # Debug: find similar text
    idx = t.find('\u7834\u574f\u6d4b\u8bd5')
    print(f'Found at: {idx}')
    if idx >= 0:
        import sys
        sys.stdout.buffer.write(repr(t[idx-10:idx+50]).encode('utf-8'))