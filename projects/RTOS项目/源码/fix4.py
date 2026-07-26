import win32file
import win32con
import pywintypes

path = r'C:\Users\11624\Desktop\Rtos项目\.codex\skills\project-learning\SKILL.md'
try:
    handle = win32file.CreateFile(
        path,
        win32con.GENERIC_WRITE,
        win32con.FILE_SHARE_READ | win32con.FILE_SHARE_WRITE | win32con.FILE_SHARE_DELETE,
        None,
        win32con.OPEN_EXISTING,
        win32con.FILE_ATTRIBUTE_NORMAL,
        None
    )
    print(f'Opened handle: {handle}')
    win32file.CloseHandle(handle)
except Exception as e:
    print(f'Error: {e}')
