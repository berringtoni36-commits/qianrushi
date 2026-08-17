---
title: "Linux系统IO"
chapter: "第2章 文件IO"
order: 2
source: "https://subingwen.cn/linux/file-io/"
author: "苏丙榅"
tags: [Linux, 教程, Subingwen]
type: reference
---

# Linux系统IO

[[archive/大丙Linux教程/第2章 文件IO/index|← 返回本章目录]] · [[01 文件描述符|上一篇：文件描述符]] · [[03 文件状态和属性信息|下一篇：文件状态和属性信息 →]]

> 来源：[原文：Linux系统IO](https://subingwen.cn/linux/file-io/)

每个系统都有自己的专属函数，我们习惯称其为系统函数。 `系统函数并不是内核函数` ，因为内核函数是不允许用户使用的，系统函数就充当了二者之间的桥梁，这样用户就可以间接的完成某些内核操作了。

在前面介绍了文件描述符，在Linux系统中必须要使用系统提供的IO函数才能基于这些文件描述符完成对相关文件的读写操作。这些Linux系统IO函数和标准C库的IO函数使用方法类似，函数名称也类似，下边开始一一介绍。

## 1\. open/close

## 1.1 函数原型

> 通过open函数我们即可打开一个磁盘文件，如果磁盘文件不存在还可以创建一个新的的文件，函数原型如下：

```c
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

/*
open是一个系统函数, 只能在linux系统中使用, windows不支持
fopen 是标准c库函数, 一般都可以跨平台使用, 可以这样理解:
        - 在linux中 fopen底层封装了Linux的系统API open
        - 在window中, fopen底层封装的是 window 的 api
*/
// 打开一个已经存在的磁盘文件
int open(const char *pathname, int flags);
// 打开磁盘文件, 如果文件不存在, 就会自动创建
int open(const char *pathname, int flags, mode_t mode);
```
- 参数介绍:
  - pathname: 被打开的文件的文件名
    - flags: 使用什么方式打开指定的文件，这个参数对应一些宏值，需要根据实际需求指定
    - `必须要指定的属性`, 以下三个属性不能同时使用, 只能任选其一
      - `O_RDONLY`: 以只读方式打开文件
            - `O_WRONLY`: 以只写方式打开文件
            - `O_RDWR`: 以读写方式打开文件
            - `可选属性`, 和上边的属性一起使用
        - `O_APPEND`: 新数据追加到文件尾部, 不会覆盖文件的原来内容
                - `O_CREAT`: 如果文件不存在, 创建该文件, 如果文件存在什么也不做
                - `O_EXCL`: 检测文件是否存在, 必须要和 O\_CREAT 一起使用, 不能单独使用: `O_CREAT | O_EXCL `
          - 检测到文件不存在, 创建新文件
                    - 检测到文件已经存在, 创建失败, 函数直接返回-1（如果不添加这个属性，不会返回-1）
    - mode: 在创建新文件的时候才需要指定这个参数的值，用于指定新文件的权限，这是一个八进制的整数
    - mode 通常使用权限位和特殊位组成的 `mode_t` 值；创建文件时还会受 umask 影响，不能简单说最大值固定为 0777。
        - 创建的新文件对应的最终实际权限, 计算公式:` (mode & ~umask)`
      - umask 掩码可以通过 umask 命令查看
                ```shell
                $ umask
                0002
                ```
            - 假设 mode 参数的值为 0777, 通过计算得到的文件权限为 0775
                ```shell
                # umask(文件掩码):  002(八进制)  = 000000010 (二进制)
                # ~umask(掩码取反): ~000000010 (二进制) = 111111101 (二进制)
                # 参数mode指定的权限为: 0777(八进制) = 111111111(二进制)
                # 计算公式: mode & ~umask
                             111111111
                       &     111111101
                            ------------------
                             111111101    二进制
                            ------------------
                             mod=0775     八进制
                ```
- 返回值:
  - 成功: 返回内核分配的文件描述符，成功值可以是 0 或更大的非负整数；失败返回 -1
    - 失败: -1

## 1.2 close函数原型

> 通过open函数可以让内核给文件分配一个文件描述符, 如果需要释放这个文件描述符就需要关闭文件。对应的这个系统函数叫做 close，函数原型如下：

```c
#include <unistd.h>
int close(int fd);
```
- 函数参数: fd 是文件描述符, 是open() 函数的返回值
- 函数返回值: 函数调用成功返回值 0, 调用失败返回 -1

## 1.3 打开已存在文件

> 我们可以使用 `open()` 函数打开一个本地已经存在的文件, 假设我们想要读写这个文件, 操作代码如下:

```c
// open.c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <fcntl.h>

int main()
{
    // 打开文件
    int fd = open("abc.txt", O_RDWR);
    if(fd == -1)
    {
        printf("打开文件失败\n");
    }
    else
    {
        printf("fd: %d\n", fd);
    }

    close(fd);
    return 0;
}
```

编译并执行程序

```shell
$ gcc open.c
$ ./a.out
fd: 3        # 打开的文件对应的文件描述符值为 3
```

## 1.4 创建新文件

> 如果要创建一个新的文件，还是使用 open 函数，只不过需要添加 `O_CREAT ` 属性, 并且给新文件指定操作权限。

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <fcntl.h>

int main()
{
    // 创建新文件
    int fd = open("./new.txt", O_CREAT|O_RDWR, 0664);
    if(fd == -1)
    {
        printf("打开文件失败\n");
    }
    else
    {
        printf("创建新文件成功, fd: %d\n", fd);
    }

    close(fd);
    return 0;
}
```
```shell
$ gcc open1.c
$ ./a.out
创建新文件成功, fd: 3
```

假设在创建新文件的时候, 给 open 指定第三个参数指定新文件的操作权限, 文件也是会被创建出来的, 只不过新的文件的权限可能会有点奇怪, 这个权限会随机分配而且还会出现一些特殊的权限位, 如下:

```shell
$ $ ll new.txt
-r-x--s--T 1 robin robin 0 Jan 30 16:17 new.txt*   # T 就是一个特殊权限
```

## 1.5 文件状态判断

> 在创建新文件的时候我们还可以通过 `O_EXCL` 进行文件的检测, 具体处理方式如下:

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <fcntl.h>

int main()
{
    // 创建新文件之前, 先检测是否存在
    // 文件存在创建失败, 返回-1, 文件不存在创建成功, 返回分配的文件描述符
    int fd = open("./new.txt", O_CREAT|O_EXCL|O_RDWR);
    if(fd == -1)
    {
        printf("创建文件失败, 已经存在了, fd: %d\n", fd);
    }
    else
    {
        printf("创建新文件成功, fd: %d\n", fd);
    }

    close(fd);
    return 0;
}
```

编译并执行程序:

```shell
$ gcc open1.c
$ ./a.out
创建文件失败, 已经存在了, fd: -1
```

## 2\. read/write

## 2.1 read

> read 函数用于读取文件内部数据，在通过 open 打开文件的时候需要指定读权限，函数原型如下：

```c
#include <unistd.h>
ssize_t read(int fd, void *buf, size_t count);
```
- 参数:
  - fd: 文件描述符, open() 函数的返回值, 通过这个参数定位打开的磁盘文件
    - buf: 是一个传出参数, 指向一块有效的内存, 用于存储从文件中读出的数据
    - 传出参数: 类似于返回值, 将变量地址传递给函数, 函数调用完毕, 地址中就有数据了
    - count: buf指针指向的内存的大小, 指定可以存储的最大字节数
- 返回值:
  - 大于0: 从文件中读出的字节数，读文件成功
    - 等于0: 代表文件读完了，读文件成功
    - \-1: 读文件失败了

## 2.2 write

> write 函数用于将数据写入到文件内部，在通过 open 打开文件的时候需要指定写权限，函数原型如下：

```c
#include <unistd.h>
ssize_t write(int fd, const void *buf, size_t count);
```
- 参数:
  - fd: 文件描述符, open() 函数的返回值, 通过这个参数定位打开的磁盘文件
    - buf: 指向一块有效的内存地址, 里边有要写入到磁盘文件中的数据
    - count: 要写入的字节数；二进制数据不能用 `strlen` 判断长度，文本数据才可能按字符串长度传入
- 返回值:
  - 大于0: 成功写入到磁盘文件中的字节数
    - \-1: 写文件失败了

## 2.3 文件拷贝

> 假设有一个比较大的磁盘文件, 打开这个文件得到文件描述符fd1，然后在创建一个新的磁盘文件得到文件描述符fd2, 在程序中通过 fd1 将文件内容读出，并通过fd2将读出的数据写入到新文件中。

```c
// 文件的拷贝
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <fcntl.h>

int main()
{
    // 1. 打开存在的文件english.txt, 读这个文件
    int fd1 = open("./english.txt", O_RDONLY);
    if(fd1 == -1)
    {
        perror("open-readfile");
        return -1;
    }

    // 2. 打开不存在的文件, 将其创建出来, 将从english.txt读出的内容写入这个文件中
    int fd2 = open("copy.txt", O_WRONLY|O_CREAT, 0664);
    if(fd2 == -1)
    {
        perror("open-writefile");
        return -1;
    }

    // 3. 循环读文件, 循环写文件
    char buf[4096];
    int len = -1;
    while( (len = read(fd1, buf, sizeof(buf))) > 0 )
    {
        // 将读到的数据写入到另一个文件中
        write(fd2, buf, len);
    }
    // 4. 关闭文件
    close(fd1);
    close(fd2);

    return 0;
}
```

## 3\. lseek

> 系统函数 lseek 的功能是比较强大的, 我们既可以通过这个函数移动文件指针, 也可以通过这个函数进行文件的拓展。这个函数的原型如下:

```c
#include <sys/types.h>
#include <unistd.h>

off_t lseek(int fd, off_t offset, int whence);
```
- 参数:
  - fd: 文件描述符, open() 函数的返回值, 通过这个参数定位打开的磁盘文件
    - offset: 偏移量，需要和第三个参数配合使用
    - whence: 通过这个参数指定函数实现什么样的功能
    - SEEK\_SET: 从文件头部开始偏移 offset 个字节
        - SEEK\_CUR: 从当前文件指针的位置向后偏移offset个字节
        - SEEK\_END: 从文件尾部向后偏移offset个字节
- 返回值:
  - 成功: 文件指针从头部开始计算总的偏移量
    - 失败: -1

## 3.1 移动文件指针

> 通过对 lseek 函数第三个参数的设置, 经常使用该函数实现如下几个功能， 如下所示：

- 文件指针移动到文件头部
    ```c
    lseek(fd, 0, SEEK_SET);
    ```
- 得到当前文件指针的位置
    ```c
    lseek(fd, 0, SEEK_CUR);
    ```
- 得到文件总大小
    ```c
    lseek(fd, 0, SEEK_END);
    ```

## 3.2 文件拓展

假设使用一个下载软件进行一个大文件下载，但是磁盘很紧张，如果不能马上将文件下载到本地，磁盘空间就可能被其他文件占用了，导致下载软件下载的文件无处存放。那么这个文件怎么解决呢？

我们可以在开始下载的时候先进行文件拓展，将一些字符写入到目标文件中，让拓展的文件和即将被下载的文件一样大，这样磁盘空间就被成功抢到手，软件就可以慢悠悠的下载对应的文件了。

使用 lseek 函数进行文件拓展必须要满足一下条件：

1. 文件指针必须要偏移到文件尾部之后， 多出来的就需要被填充的部分。
2. 文件拓展之后，必须要使用 `write()` 函数进行一次写操作（写什么都可以，没有字节数要求）。

文件拓展举例：

```c
// lseek.c
// 拓展文件大小
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>

int main()
{
    int fd = open("hello.txt", O_RDWR);
    if(fd == -1)
    {
        perror("open");
        return -1;
    }

    // 文件拓展, 一共增加了 1001 个字节
    lseek(fd, 1000, SEEK_END);
    write(fd, " ", 1);

    close(fd);
    return 0;
}
```

查看执行执行的效果

```shell
# 编译程序
$ gcc lseek.c

# 查看目录文件信息
$ ll
-rwxrwxr-x 1 robin robin 8808 May  6  2019 a.out*
-rwxrwxr-x 1 robin robin 1013 May  6  2019 hello.txt*
-rw-rw-r-- 1 robin robin  299 May  6  2019 lseek.c

# 执行程序, 拓展文件
$ ./a.out

# 在查看目录文件信息
$ ll
-rwxrwxr-x 1 robin robin 8808 May  6  2019 a.out*
-rwxrwxr-x 1 robin robin 2014 Jan 30 17:39 hello.txt*   # 大小从 1013 -> 2014, 拓展了1001字节
-rw-rw-r-- 1 robin robin  299 May  6  2019 lseek.c
```

## 4\. truncate/ftruncate

truncate/ftruncate 这两个函数的功能是一样的，可以对文件进行拓展也可以截断文件。使用这两个函数拓展文件比使用lseek要简单。这两个函数的函数原型如下：

```c
// 拓展文件或截断文件
#include <unistd.h>
#include <sys/types.h>

int truncate(const char *path, off_t length);
    -
int ftruncate(int fd, off_t length);
```
- 参数：
  - path: 要拓展/截断的文件的文件名
    - fd: 文件描述符, open() 得到的
    - length: 文件的最终大小
    - 文件原来size > length，文件被截断, 尾部多余的部分被删除, 文件最终长度为length
        - 文件原来size < length，文件被拓展, 文件最终长度为length
- 返回值: 成功返回0; 失败返回值-1

truncate() 和 ftruncate() 两个函数的区别在于一个使用文件名一个使用文件描述符操作文件, 功能相同。

不管是使用这两个函数还是使用 lseek() 函数拓展文件，文件尾部填充的字符都是 0。

## 5\. perror

在查看Linux系统函数的时候, 我们可以发现一个规律: 大部分系统函数的返回值都是整形，并且通过这个返回值来描述系统函数的状态（调用是否成功了）。在man 文档中关于系统函数的返回值大部分时候都是这样描述的：

```
RETURN VALUE
       On  success,  zero is returned.  On error, -1 is returned, and errno is set
       appropriately.

       如果成功，则返回0。出现错误时，返回-1，并给errno设置一个适当的值。
```

`errno` 是线程局部的错误码接口（通常通过宏访问），只有在规定的失败返回值出现后才应读取；成功调用不会保证把它清零。错误码定义由系统头文件提供。

1. /usr/include/asm-generic/errno-base.h
2. /usr/include/asm-generic/errno.h

得到错误号，去查询对应的头文件是非常不方便的，我们可以通过 perror 函数将错误号对应的描述信息打印出来

```c
#include <stdio.h>
// 参数, 自己指定这个字符串的值就可以, 指定什么就会原样输出, 除此之外还会输出错误号对应的描述信息
void perror(const char *s);
```

举例: 使用 perrno 打印错误信息

```c
// open.c
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>

int main()
{
    int fd = open("hello.txt", O_RDWR|O_EXCL|O_CREAT, 0777);
    if(fd == -1)
    {
        perror("open");
        return -1;
    }

    close(fd);
    return 0;
}
```

编译并执行程序

```shell
$ gcc open.c
$ $ ./a.out
open: File exists    # 通过 perror 输出的错误信息
```

## 6\. 错误号

为了方便查询, 特将全局变量 errno 和错误信息描述的对照关系贴出:

## 6.1 Part1

信息来自头文件: /usr/include/asm-generic/errno-base.h

```c
#define EPERM            1      /* Operation not permitted */
#define ENOENT           2      /* No such file or directory */
#define ESRCH            3      /* No such process */
#define EINTR            4      /* Interrupted system call */
#define EIO              5      /* I/O error */
#define ENXIO            6      /* No such device or address */
#define E2BIG            7      /* Argument list too long */
#define ENOEXEC          8      /* Exec format error */
#define EBADF            9      /* Bad file number */
#define ECHILD          10      /* No child processes */
#define EAGAIN          11      /* Try again */
#define ENOMEM          12      /* Out of memory */
#define EACCES          13      /* Permission denied */
#define EFAULT          14      /* Bad address */
#define ENOTBLK         15      /* Block device required */
#define EBUSY           16      /* Device or resource busy */
#define EEXIST          17      /* File exists */
#define EXDEV           18      /* Cross-device link */
#define ENODEV          19      /* No such device */
#define ENOTDIR         20      /* Not a directory */
#define EISDIR          21      /* Is a directory */
#define EINVAL          22      /* Invalid argument */
#define ENFILE          23      /* File table overflow */
#define EMFILE          24      /* Too many open files */
#define ENOTTY          25      /* Not a typewriter */
#define ETXTBSY         26      /* Text file busy */
#define EFBIG           27      /* File too large */
#define ENOSPC          28      /* No space left on device */
#define ESPIPE          29      /* Illegal seek */
#define EROFS           30      /* Read-only file system */
#define EMLINK          31      /* Too many links */
#define EPIPE           32      /* Broken pipe */
#define EDOM            33      /* Math argument out of domain of func */
#define ERANGE          34      /* Math result not representable */
```

## 6.2 Part2

信息来自头文件: /usr/include/asm-generic/errno.h

```c
#define EDEADLK         35      /* Resource deadlock would occur */
#define ENAMETOOLONG    36      /* File name too long */
#define ENOLCK          37      /* No record locks available */

/*
 * This error code is special: arch syscall entry code will return
 * -ENOSYS if users try to call a syscall that doesn't exist.  To keep
 * failures of syscalls that really do exist distinguishable from
 * failures due to attempts to use a nonexistent syscall, syscall
 * implementations should refrain from returning -ENOSYS.
 */
#define ENOSYS          38      /* Invalid system call number */

#define ENOTEMPTY       39      /* Directory not empty */
#define ELOOP           40      /* Too many symbolic links encountered */
#define EWOULDBLOCK     EAGAIN  /* Operation would block */
#define ENOMSG          42      /* No message of desired type */
#define EIDRM           43      /* Identifier removed */
#define ECHRNG          44      /* Channel number out of range */
#define EL2NSYNC        45      /* Level 2 not synchronized */
#define EL3HLT          46      /* Level 3 halted */
#define EL3RST          47      /* Level 3 reset */
#define ELNRNG          48      /* Link number out of range */
#define EUNATCH         49      /* Protocol driver not attached */
#define ENOCSI          50      /* No CSI structure available */
#define EL2HLT          51      /* Level 2 halted */
#define EBADE           52      /* Invalid exchange */
#define EBADR           53      /* Invalid request descriptor */
#define EXFULL          54      /* Exchange full */
#define ENOANO          55      /* No anode */
#define EBADRQC         56      /* Invalid request code */
#define EBADSLT         57      /* Invalid slot */

#define EDEADLOCK       EDEADLK

#define EBFONT          59      /* Bad font file format */
#define ENOSTR          60      /* Device not a stream */
#define ENODATA         61      /* No data available */
#define ETIME           62      /* Timer expired */
#define ENOSR           63      /* Out of streams resources */
#define ENONET          64      /* Machine is not on the network */
#define ENOPKG          65      /* Package not installed */
#define EREMOTE         66      /* Object is remote */
#define ENOLINK         67      /* Link has been severed */
#define EADV            68      /* Advertise error */
#define ESRMNT          69      /* Srmount error */
#define ECOMM           70      /* Communication error on send */
#define EPROTO          71      /* Protocol error */
#define EMULTIHOP       72      /* Multihop attempted */
#define EDOTDOT         73      /* RFS specific error */
#define EBADMSG         74      /* Not a data message */
#define EOVERFLOW       75      /* Value too large for defined data type */
#define ENOTUNIQ        76      /* Name not unique on network */
#define EBADFD          77      /* File descriptor in bad state */
#define EREMCHG         78      /* Remote address changed */
#define ELIBACC         79      /* Can not access a needed shared library */
#define ELIBBAD         80      /* Accessing a corrupted shared library */
#define ELIBSCN         81      /* .lib section in a.out corrupted */
#define ELIBMAX         82      /* Attempting to link in too many shared libraries */
#define ELIBEXEC        83      /* Cannot exec a shared library directly */
#define EILSEQ          84      /* Illegal byte sequence */
#define ERESTART        85      /* Interrupted system call should be restarted */
#define ESTRPIPE        86      /* Streams pipe error */
#define EUSERS          87      /* Too many users */
#define ENOTSOCK        88      /* Socket operation on non-socket */
#define EDESTADDRREQ    89      /* Destination address required */
#define EMSGSIZE        90      /* Message too long */
#define EPROTOTYPE      91      /* Protocol wrong type for socket */
#define ENOPROTOOPT     92      /* Protocol not available */
#define EPROTONOSUPPORT 93      /* Protocol not supported */
#define ESOCKTNOSUPPORT 94      /* Socket type not supported */
#define EOPNOTSUPP      95      /* Operation not supported on transport endpoint */
#define EPFNOSUPPORT    96      /* Protocol family not supported */
#define EAFNOSUPPORT    97      /* Address family not supported by protocol */
#define EADDRINUSE      98      /* Address already in use */
#define EADDRNOTAVAIL   99      /* Cannot assign requested address */
#define ENETDOWN        100     /* Network is down */
#define ENETUNREACH     101     /* Network is unreachable */
#define ENETRESET       102     /* Network dropped connection because of reset */
#define ECONNABORTED    103     /* Software caused connection abort */
#define ECONNRESET      104     /* Connection reset by peer */
#define ENOBUFS         105     /* No buffer space available */
#define EISCONN         106     /* Transport endpoint is already connected */
#define ENOTCONN        107     /* Transport endpoint is not connected */
#define ESHUTDOWN       108     /* Cannot send after transport endpoint shutdown */
#define ETOOMANYREFS    109     /* Too many references: cannot splice */
#define ETIMEDOUT       110     /* Connection timed out */
#define ECONNREFUSED    111     /* Connection refused */
#define EHOSTDOWN       112     /* Host is down */
#define EHOSTUNREACH    113     /* No route to host */
#define EALREADY        114     /* Operation already in progress */
#define EINPROGRESS     115     /* Operation now in progress */
#define ESTALE          116     /* Stale file handle */
#define EUCLEAN         117     /* Structure needs cleaning */
#define ENOTNAM         118     /* Not a XENIX named type file */
#define ENAVAIL         119     /* No XENIX semaphores available */
#define EISNAM          120     /* Is a named type file */
#define EREMOTEIO       121     /* Remote I/O error */
#define EDQUOT          122     /* Quota exceeded */

#define ENOMEDIUM       123     /* No medium found */
#define EMEDIUMTYPE     124     /* Wrong medium type */
#define ECANCELED       125     /* Operation Canceled */
#define ENOKEY          126     /* Required key not available */
#define EKEYEXPIRED     127     /* Key has expired */
#define EKEYREVOKED     128     /* Key has been revoked */
#define EKEYREJECTED    129     /* Key was rejected by service */

/* for robust mutexes */
#define EOWNERDEAD      130     /* Owner died */
#define ENOTRECOVERABLE 131     /* State not recoverable */

#define ERFKILL         132     /* Operation not possible due to RF-kill */

#define EHWPOISON       133     /* Memory page has hardware error */
```
