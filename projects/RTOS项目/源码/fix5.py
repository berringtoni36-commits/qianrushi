import os, sys

path = r'C:\Users\11624\Desktop\Rtos项目\.codex\skills\project-learning\SKILL.md'

try:
    fd = os.open(path, os.O_WRONLY | os.O_BINARY)
    print(f'fd = {fd}')
    
    # Read content via read-only path
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    old = '5. **保持沟通**：随时询问用户感受'
    new = old + '\n6. **复习文档规范**：复习文档只放核心知识点、关键代码、常见问题、数据流、知识链\n   - 不要在复习文档中放破坏测试内容，破坏测试是学习过程中的环节，不属于复习文档\n   - 如果某个知识点属于高频面试考点（即 rtos项目高频面试点.md 中的内容），在复习文档中必须标注：> 面试高频考点详见 rtos项目高频面试点.md'
    
    content2 = content.replace(old, new, 1)
    data = content2.encode('utf-8')
    
    os.lseek(fd, 0, os.SEEK_SET)
    os.write(fd, data)
    os.ftruncate(fd, len(data))
    os.close(fd)
    print('OK')
except Exception as e:
    print(f'Error: {e}')
