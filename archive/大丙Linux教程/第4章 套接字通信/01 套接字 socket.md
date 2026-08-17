---
title: "套接字 socket"
chapter: "第4章 套接字通信"
order: 1
source: "https://subingwen.cn/linux/socket/"
author: "苏丙榅"
tags: [Linux, 教程, Subingwen]
type: reference
---

# 套接字 socket

[[archive/大丙Linux教程/第4章 套接字通信/index|← 返回本章目录]] · [[10 线程池 - C改C++版|上一篇：线程池 - C改C++版]] · [[02 三次握手、四次挥手|下一篇：三次握手、四次挥手 →]]

> 来源：[原文：套接字 socket](https://subingwen.cn/linux/socket/)

## 1\. 概念

- 局域网和广域网
  - 局域网：局域网将一定区域内的各种计算机、外部设备和数据库连接起来形成计算机通信的私有网络。
    - 广域网：又称 **广域网** 、 **外网** 、 **公网** 。是连接不同地区局域网或城域网计算机通信的远程公共网络。
- IP（Internet Protocol）：本质是一个整形数，用于表示计算机在网络中的地址。IP协议版本有两个：IPv4和IPv6
  - IPv4（Internet Protocol version4）：
    - 使用一个32位的整形数描述一个IP地址，4个字节，int型
        - 也可以使用一个点分十进制字符串描述这个IP地址： `192.168.247.135 `
        - 分成了4份，每份1字节，8bit（char），最大值为 255
        - 按照IPv4协议计算，可以使用的IP地址共有 2 <sup>32</sup> 个
    - IPv6（Internet Protocol version6）：
    - 使用一个128位的整形数描述一个IP地址，16个字节
        - 也可以使用一个字符串描述这个IP地址： `2001:0db8:3c4d:0015:0000:0000:1a2f:1a2b`
        - 分成了8份，每份2字节，每一部分以16进制的方式表示
        - 按照IPv6协议计算，可以使用的IP地址共有 2 <sup>128</sup> 个
    - 查看IP地址
        ```shell
        # linux
        $ ifconfig
        # windows
        $ ipconfig
        # 测试网络是否畅通
        # 主机a: 192.168.1.11
        # 当前主机: 192.168.1.12
        $ ping 192.168.1.11     # 测试是否可用连接局域网
        $ ping www.baidu.com    # 测试是否可用连接外网
        # 127.0.0.1 是回环地址，只在本机协议栈内通信，不等于本机连接局域网的网卡地址
        # 假设当前电脑没有联网, 就没有IP地址, 又要做网络测试, 可用使用 127.0.0.1 进行本地测试
        ```
- 端口
端口的作用是定位到主机上的某一个进程，通过这个端口进程就可以接受到对应的网络数据了。
> 比如: 在电脑上运行了微信和QQ, 小明通过客户端给我的的微信发消息, 电脑上的微信就收到了消息, 为什么?
>
> - 运行在电脑上的微信和QQ都绑定了不同的端口
> - 通过IP地址可以定位到某一台主机，通过端口就可以定位到主机上的某一个进程
> - 通过指定的IP和端口，发送数据的时候对端就能接受到数据了
端口也是一个整形数 ` unsigned short` ，一个16位整形数，有效端口的取值范围是： `0 ~ 65535` (0 ~ 2 <sup>16</sup> -1)
提问：计算机中所有的进程都需要关联一个端口吗，一个端口可以被重复使用吗?
  - 不需要，如果这个进程不需要网络通信，那么这个进程就不需要绑定端口的
    - 同一地址族、协议和本地地址组合通常只能由一个 socket 绑定；SO_REUSEADDR、SO_REUSEPORT、通配地址以及继承的文件描述符都会影响复用规则，不能简化为“一个端口只能给一个进程”。
- OSI/ISO 网络分层模型
OSI（Open System Interconnect），即开放式系统互联。 一般都叫OSI参考模型，是ISO（国际标准化组织组织）在1985年研究的网络互联模型。

![[assets/Linux教程/26-01.png]]

> - 物理层：负责最后将信息编码成电流脉冲或其它信号用于网上传输
> - 数据链路层:
> - 数据链路层通过物理网络链路供数据传输。
> - 规定了0和1的分包形式，确定了网络数据包的形式；
> - 网络层
> - 网络层负责在源和终点之间建立连接;
> - 此处需要确定计算机的位置，通过IPv4，IPv6格式的IP地址来找到对应的主机
> - 传输层
> - 传输层向高层提供可靠的端到端的网络数据流服务。
> - 应用通过 socket 在协议栈上绑定地址和端口，该层提供端到端的传输服务，并不是在网卡上注册端口。
> - 会话层
> - 会话层建立、管理和终止表示层与实体之间的通信会话；
> - 建立一个连接（自动的手机信息、自动的网络寻址）;
> - 表示层:
> - 对应用层数据编码和转化, 确保以一个系统应用层发送的信息 可以被另一个系统应用层识别;

## 2\. 网络协议

网络协议指的是计算机网络中互相通信的对等实体之间交换信息时所必须遵守的规则的集合。一般系统网络协议包括五个部分：通信环境，传输服务，词汇表，信息的编码格式，时序、规则和过程。先来通过下面几幅图了解一下常用的网络协议的格式：

- TCP协议 -> 传输层协议

![[assets/Linux教程/26-02.png]]

- UDP协议 -> 传输层协议

![[assets/Linux教程/26-03.png]]

- IP协议 -> 网络层协议

![[assets/Linux教程/26-04.png]]

- 以太网帧协议 -> 网络接口层协议

![[assets/Linux教程/26-05.png]]

- 数据的封装

![[assets/Linux教程/26-06.png]]

在网络通信的时候, 程序猿需要负责的应用层数据的处理(最上层)
  - 应用层的数据可以使用某些协议进行封装, 也可以不封装
    - 程序猿需要调用发送数据的接口函数，将数据发送出去
    - 程序猿调用的API做底层数据处理
    - 传输层使用传输层协议打包数据
        - 网络层使用网络层协议打包数据
        - 网络接口层使用网络接口层协议打包数据
        - 数据被发送到internet
    - 接收端接收到发送端的数据
    - 程序猿调用接收数据的函数接收数据
        - 调用的API做相关的底层处理:
      - 网络接口层拆包 ==> 网络层的包
            - 网络层拆包 ==> 网络层的包
            - 传输层拆包 ==> 传输层数据
        - 如果应用层也使用了协议对数据进行了封装，数据的包的解析需要程序猿做

## 3\. socket编程

Socket套接字由远景研究规划局（Advanced Research Projects Agency, ARPA）资助加里福尼亚大学伯克利分校的一个研究组研发。其目的是将TCP/IP协议相关软件移植到UNIX类系统中。设计者开发了一个接口，以便应用程序能简单地调用该接口通信。这个接口不断完善，最终形成了Socket套接字。Linux系统采用了Socket套接字，因此，Socket接口就被广泛使用，到现在已经成为事实上的标准。与套接字相关的函数被包含在头文件sys/socket.h中。

![[assets/Linux教程/26-07.png]]

通过上面的描述可以得知，套接字对应程序猿来说就是一套网络通信的接口，使用这套接口就可以完成网络通信。网络通信的主体主要分为两部分： `客户端` 和 `服务器端` 。在客户端和服务器通信的时候需要频繁提到三个概念： `IP` 、 `端口` 、 `通信数据` ，下面介绍一下需要注意的一些细节问题。

## 3.1 字节序

在各种计算机体系结构中，对于字节、字等的存储机制有所不同，因而引发了计算机通信领域中一个很重要的问题，即通信双方交流的信息单元（比特、字节、字、双字等等）应该以什么样的顺序进行传送。如果不达成一致的规则，通信双方将无法进行正确的编/译码从而导致通信失败。

**字节序，顾名思义字节的顺序，就是大于一个字节类型的数据在内存中的存放顺序，也就是说对于单字符来说是没有字节序问题的，字符串是单字符的集合，因此字符串也没有字节序问题。**

目前在各种体系的计算机中通常采用的字节存储机制主要有两种：Big-Endian 和 Little-Endian，下面先从字节序说起。

![[assets/Linux教程/26-08.jpg]]

> 大小端的这个名词最早出现在《格列佛游记》中，里边记载了两个征战的强国，你不会想到的是，他们打仗竟然和剥鸡蛋的顺序有关。很多人认为，剥鸡蛋时应该打破鸡蛋较大的一端，这群人被称作“大端（Big endian）派”。可是那时皇帝儿子小时候吃鸡蛋的时候碰巧将一个手指弄破了。所以，当时的皇帝就下令剥鸡蛋必须打破鸡蛋较小的一端，违令者重罚，由此产生了“小端（Little endian）派”。
>
> 老百姓们对这项命令极其反感，由此引发了6次叛乱，其中一个皇帝送了命，另一个丢了王位。据估计，先后几次有11000人情愿受死也不肯去打破鸡蛋较小的一端！

- Little-Endian -> 主机字节序 (小端)
  - 数据的 `低位字节` 存储到内存的 `低地址位`, 数据的 `高位字节` 存储到内存的 `高地址位`
    - 我们使用的PC机，数据的存储默认使用的是小端
- Big-Endian -> 网络字节序 (大端)
  - 据的 `低位字节` 存储到内存的 `高地址位`, 数据的 `高位字节` 存储到内存的 `低地址位`
    - 网络字节序只约束协议定义的整数和地址字段；应用负载的字节顺序由应用层协议定义，不能说所有收发数据都按大端存储。
- 字节序举例
    ```c
    // 有一个16进制的数, 有32位 (int): 0xab5c01ff
    // 字节序, 最小的单位: char 字节, int 有4个字节, 需要将其拆分为4份
    // 一个字节 unsigned char, 最大值是 255(十进制) ==> ff(16进制)
                     内存低地址位                内存的高地址位
    --------------------------------------------------------------------------->
    小端:         0xff        0x01        0x5c        0xab
    大端:         0xab        0x5c        0x01        0xff
    ```

![[assets/Linux教程/26-09.png]]

![[assets/Linux教程/26-10.png]]

- 函数
> BSD Socket提供了封装好的转换接口，方便程序员使用。包括从主机字节序到网络字节序的转换函数：htons、htonl；从网络字节序到主机字节序的转换函数：ntohs、ntohl。
    ```c
    #include <arpa/inet.h>
    // u:unsigned
    // 16: 16位, 32:32位
    // h: host, 主机字节序
    // n: net, 网络字节序
    // s: short
    // l: int
    // 这套api主要用于 网络通信过程中 IP 和 端口 的 转换
    // 将一个短整形从主机字节序 -> 网络字节序
    uint16_t htons(uint16_t hostshort);
    // 将一个整形从主机字节序 -> 网络字节序
    uint32_t htonl(uint32_t hostlong);
    // 将一个短整形从网络字节序 -> 主机字节序
    uint16_t ntohs(uint16_t netshort)
    // 将一个整形从网络字节序 -> 主机字节序
    uint32_t ntohl(uint32_t netlong);
    ```

## 3.2 IP地址转换

虽然IP地址本质是一个整形数，但是在使用的过程中都是通过一个字符串来描述，下面的函数描述了如何将一个字符串类型的IP地址进行大小端转换：

```c
// 将文本形式的 IP 地址转换为二进制网络地址
// src 是文本形式的地址，dst 接收二进制网络地址结构（按网络字节序表示）
int inet_pton(int af, const char *src, void *dst);
```
- 参数:
  - af: 地址族(IP地址的家族包括ipv4和ipv6)协议
    - AF\_INET: ipv4格式的ip地址
        - AF\_INET6: ipv6格式的ip地址
    - src: 传入参数, 对应要转换的点分十进制的ip地址: 192.168.1.100
    - dst: 传出参数, 函数调用完成, 转换得到的二进制网络地址写入这块内存
- 返回值：成功返回1，失败返回0或者-1
```c
#include <arpa/inet.h>
// 将二进制网络地址转换为文本形式
const char *inet_ntop(int af, const void *src, char *dst, socklen_t size);
```
- 参数:
  - af: 地址族协议
    - AF\_INET: ipv4格式的ip地址
        - AF\_INET6: ipv6格式的ip地址
    - src: 传入参数, 这个指针指向的内存中存储了大端的整形IP地址
    - dst: 传出参数, 存储转换得到的文本形式的 IP 地址
    - size: 修饰dst参数的, 标记dst指向的内存中最多可以存储多少个字节
- 返回值:
  - 成功: 指针指向第三个参数对应的内存地址, 通过返回值也可以直接取出转换得到的IP字符串
    - 失败: NULL

还有一组函数也能进程IP地址大小端的转换，但是只能处理ipv4的ip地址：

```c
// 点分十进制IP -> 大端整形
in_addr_t inet_addr (const char *cp);

// 大端整形 -> 点分十进制IP
char* inet_ntoa(struct in_addr in);
```

## 3.3 sockaddr 数据结构

![[assets/Linux教程/26-11.png]]

```c
// 在写数据的时候不好用
struct sockaddr {
    sa_family_t sa_family;       // 地址族协议, ipv4
    char        sa_data[14];     // 端口(2字节) + IP地址(4字节) + 填充(8字节)
}

typedef unsigned short  uint16_t;
typedef unsigned int    uint32_t;
typedef uint16_t in_port_t;
typedef uint32_t in_addr_t;
typedef unsigned short int sa_family_t;
#define __SOCKADDR_COMMON_SIZE (sizeof (unsigned short int))

struct in_addr
{
    in_addr_t s_addr;
};

// sizeof(struct sockaddr) == sizeof(struct sockaddr_in)
struct sockaddr_in
{
    sa_family_t sin_family;        /* 地址族协议: AF_INET */
    in_port_t sin_port;         /* 端口, 2字节-> 大端  */
    struct in_addr sin_addr;    /* IP地址, 4字节 -> 大端  */
    /* 填充 8字节 */
    unsigned char sin_zero[sizeof (struct sockaddr) - sizeof(sin_family) -
               sizeof (in_port_t) - sizeof (struct in_addr)];
};
```

## 3.4 套接字函数

使用套接字通信函数需要包含头文件 `<arpa/inet.h>` ，包含了这个头文件 `<sys/socket.h>` 就不用在包含了。

```c
// 创建一个套接字
int socket(int domain, int type, int protocol);
```
- 参数:
  - domain: 使用的地址族协议
    - AF\_INET: 使用IPv4格式的ip地址
        - AF\_INET6: 使用IPv6格式的ip地址
    - type:
    - SOCK\_STREAM: 使用流式的传输协议
        - SOCK\_DGRAM: 使用报式(报文)的传输协议
    - protocol: 一般写0即可, 使用默认的协议
    - SOCK\_STREAM: 流式传输默认使用的是tcp
        - SOCK\_DGRAM: 报式传输默认使用的udp
- 返回值:
  - 成功: 可用于套接字通信的文件描述符
    - 失败: -1

函数的返回值是一个文件描述符，通过这个文件描述符可以操作内核中的某一块内存，网络通信是基于这个文件描述符来完成的。

```c
// 将文件描述符和本地的IP与端口进行绑定
int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
```
- 参数:
  - sockfd: 监听的文件描述符, 通过socket()调用得到的返回值
    - addr: 传入参数, 要绑定的IP和端口信息需要初始化到这个结构体中， `IPv4/IPv6 地址和端口字段按 socket API 要求使用网络字节序（文本地址用 inet_pton 转换）`
    - addrlen: 参数addr指向的内存大小, sizeof(struct sockaddr)
- 返回值：成功返回0，失败返回-1
```c
// 给监听的套接字设置监听
int listen(int sockfd, int backlog);
```
- 参数:
  - sockfd: 文件描述符, 可以通过调用socket()得到，在监听之前必须要绑定 bind()
    - backlog: 同时能处理的最大连接要求，最大值为128
- 返回值：函数调用成功返回0，调用失败返回 -1
```c
// 等待并接受客户端的连接请求, 建立新的连接, 会得到一个新的文件描述符(通信的)
int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
```
- 参数:
  - sockfd: 监听的文件描述符
    - addr: 传出参数, 里边存储了建立连接的客户端的地址信息
    - addrlen: 传入传出参数，用于存储addr指向的内存大小
- 返回值：函数调用成功，得到一个文件描述符, 用于和建立连接的这个客户端通信，调用失败返回 -1

`这个函数是一个阻塞函数，当没有新的客户端连接请求的时候，该函数阻塞；当检测到有新的客户端连接请求时，阻塞解除，新连接就建立了，得到的返回值也是一个文件描述符，基于这个文件描述符就可以和客户端通信了。`

```c
// 接收数据
ssize_t read(int sockfd, void *buf, size_t size);
ssize_t recv(int sockfd, void *buf, size_t size, int flags);
```
- 参数:
  - sockfd: 用于通信的文件描述符, accept() 函数的返回值
    - buf: 指向一块有效内存, 用于存储接收是数据
    - size: 参数buf指向的内存的容量
    - flags: 特殊的属性, 一般不使用, 指定为 0
- 返回值:
  - 大于0：实际接收的字节数
    - 等于0：对方断开了连接
    - \-1：接收数据失败了

`如果连接没有断开，接收端接收不到数据，接收数据的函数会阻塞等待数据到达，数据到达后函数解除阻塞，开始接收数据，当发送端断开连接，接收端无法接收到任何数据，但是这时候就不会阻塞了，函数直接返回0。`

```c
// 发送数据的函数
ssize_t write(int fd, const void *buf, size_t len);
ssize_t send(int fd, const void *buf, size_t len, int flags);
```
- 参数:
  - fd: 通信的文件描述符, accept() 函数的返回值
    - buf: 传入参数, 要发送的字符串
    - len: 要发送的字符串的长度
    - flags: 特殊的属性, 一般不使用, 指定为 0
- 返回值：
  - 大于0：实际发送的字节数，和参数len是相等的
    - \-1：发送数据失败了
```c
// 成功连接服务器之后, 客户端会自动随机绑定一个端口
// 服务器端调用accept()的函数, 第二个参数存储的就是客户端的IP和端口信息
int connect(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
```
- 参数:
  - sockfd: 通信的文件描述符, 通过调用socket()函数就得到了
    - addr: 存储了要连接的服务器端的地址信息: iP 和 端口，这个IP和端口也需要转换为大端然后再赋值
    - addrlen: addr指针指向的内存的大小 sizeof(struct sockaddr)
- 返回值：连接成功返回0，连接失败返回-1

## 4\. TCP通信流程

TCP是一个面向连接的，安全的，流式传输协议，这个协议是一个传输层协议。

- 面向连接：是一个双向连接，通过三次握手完成，断开连接需要通过四次挥手完成。
- 安全：tcp通信过程中，会对发送的每一数据包都会进行校验, 如果发现数据丢失, 会自动重传
- 流式传输：发送端和接收端处理数据的速度，数据的量都可以不一致

![[assets/Linux教程/26-12.jpg]]

## 4.1 服务器端通信流程

1. 创建用于监听的套接字, 这个套接字是一个文件描述符
    ```c
    int lfd = socket();
    ```
2. 将得到的监听的文件描述符和本地的IP 端口进行绑定
    ```c
    bind();
    ```
3. 设置监听(成功之后开始监听, 监听的是客户端的连接)
    ```c
    listen();
    ```
4. 等待并接受客户端的连接请求, 建立新的连接, 会得到一个新的文件描述符(通信的)， `没有新连接请求就阻塞`
    ```c
    int cfd = accept();
    ```
5. 通信，读写操作默认都是阻塞的
    ```c
    // 接收数据
    read(); / recv();
    // 发送数据
    write(); / send();
    ```
6. 断开连接, 关闭套接字
    ```c
    close();
    ```

> 在tcp的服务器端, 有两类文件描述符
>
> - 监听的文件描述符
> - 只需要有一个
> - 不负责和客户端通信, 负责检测客户端的连接请求, 检测到之后调用accept就可以建立新的连接
> - 通信的文件描述符
> - 负责和建立连接的客户端通信
> - 如果有N个客户端和服务器建立了新的连接, 通信的文件描述符就有N个，每个客户端和服务器都对应一个通信的文件描述符

![[assets/Linux教程/26-13.png]]

- 文件描述符对应的内存结构：
  - `一个文件文件描述符对应两块内存, 一块内存是读缓冲区, 一块内存是写缓冲区`
    - 读数据: `通过文件描述符将内存中的数据读出, 这块内存称之为读缓冲区`
    - 写数据: `通过文件描述符将数据写入到某块内存中, 这块内存称之为写缓冲区`
- 监听的文件描述符:
  - 客户端的连接请求会发送到服务器端监听的文件描述符的读缓冲区中
    - 读缓冲区中有数据, 说明有新的客户端连接
    - 调用accept()函数, 这个函数会检测监听文件描述符的读缓冲区
    - 检测不到数据, 该函数阻塞
        - 如果检测到数据, 解除阻塞, 新的连接建立
- 通信的文件描述符:
  - 客户端和服务器端都有通信的文件描述符
    - 发送数据：调用函数 write() / send()，数据进入到内核中
    - 数据并没有被发送出去, 而是将数据写入到了通信的文件描述符对应的写缓冲区中
        - 内核检测到通信的文件描述符写缓冲区中有数据, 内核会将数据发送到网络中
    - 接收数据: 调用的函数 read() / recv(), 从内核读数据
    - 数据如何进入到内核程序猿不需要处理, 数据进入到通信的文件描述符的读缓冲区中
        - 数据进入到内核, 必须使用通信的文件描述符, 将数据从读缓冲区中读出即可

> 基于tcp的服务器端通信代码:

```c
// server.c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <arpa/inet.h>

int main()
{
    // 1. 创建监听的套接字
    int lfd = socket(AF_INET, SOCK_STREAM, 0);
    if(lfd == -1)
    {
        perror("socket");
        exit(0);
    }

    // 2. 将socket()返回值和本地的IP端口绑定到一起
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
// 大端端口
    // INADDR_ANY代表本机的所有IP, 假设有三个网卡就有三个IP地址
    // 这个宏可以代表任意一个IP地址
    // 这个宏一般用于本地的绑定操作
    addr.sin_addr.s_addr = INADDR_ANY;  // 这个宏的值为0 == 0.0.0.0
//    inet_pton(AF_INET, "192.168.237.131", &addr.sin_addr.s_addr);
    int ret = bind(lfd, (struct sockaddr*)&addr, sizeof(addr));
    if(ret == -1)
    {
        perror("bind");
        exit(0);
    }

    // 3. 设置监听
    ret = listen(lfd, 128);
    if(ret == -1)
    {
        perror("listen");
        exit(0);
    }

    // 4. 阻塞等待并接受客户端连接
    struct sockaddr_in cliaddr;
    int clilen = sizeof(cliaddr);
    int cfd = accept(lfd, (struct sockaddr*)&cliaddr, &clilen);
    if(cfd == -1)
    {
        perror("accept");
        exit(0);
    }
    // 打印客户端的地址信息
    char ip[24] = {0};
    printf("客户端的IP地址: %s, 端口: %d\n",
           inet_ntop(AF_INET, &cliaddr.sin_addr.s_addr, ip, sizeof(ip)),
           ntohs(cliaddr.sin_port));

    // 5. 和客户端通信
    while(1)
    {
        // 接收数据
        char buf[1024];
        memset(buf, 0, sizeof(buf));
        int len = read(cfd, buf, sizeof(buf));
        if(len > 0)
        {
            printf("客户端say: %s\n", buf);
            write(cfd, buf, len);
        }
        else if(len  == 0)
        {
            printf("客户端断开了连接...\n");
            break;
        }
        else
        {
            perror("read");
            break;
        }
    }

    close(cfd);
    close(lfd);

    return 0;
}
```

## 4.2 客户端的通信流程

> 在单线程的情况下客户端通信的文件描述符有一个, 没有监听的文件描述符

1. 创建一个通信的套接字
```c
int cfd = socket();
```
2. 连接服务器, 需要知道服务器绑定的IP和端口
```c
connect();
```
3. 通信
```c
// 接收数据
read(); / recv();
// 发送数据
write(); / send();
```
4. 断开连接, 关闭文件描述符(套接字)
```c
close();
```

> 基于tcp通信的客户端通信代码:

```c
// client.c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <arpa/inet.h>

int main()
{
    // 1. 创建通信的套接字
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if(fd == -1)
    {
        perror("socket");
        exit(0);
    }

    // 2. 连接服务器
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
// 大端端口
    inet_pton(AF_INET, "192.168.237.131", &addr.sin_addr.s_addr);

    int ret = connect(fd, (struct sockaddr*)&addr, sizeof(addr));
    if(ret == -1)
    {
        perror("connect");
        exit(0);
    }

    // 3. 和服务器端通信
    int number = 0;
    while(1)
    {
        // 发送数据
        char buf[1024];
        sprintf(buf, "你好, 服务器...%d\n", number++);
        write(fd, buf, strlen(buf)+1);

        // 接收数据
        memset(buf, 0, sizeof(buf));
        int len = read(fd, buf, sizeof(buf));
        if(len > 0)
        {
            printf("服务器say: %s\n", buf);
        }
        else if(len  == 0)
        {
            printf("服务器断开了连接...\n");
            break;
        }
        else
        {
            perror("read");
            break;
        }
// 每隔1s发送一条数据
    }

    close(fd);

    return 0;
}
```

## 5\. 扩展阅读

在Window中也提供了套接字通信的API，这些API函数与Linux平台的API函数几乎相同，以至于很多人认为套接字通信的API函数库只有一套，下面来看一下这些Windows平台的套接字函数：

## 5.1 初始化套接字环境

使用Windows中的套接字函数需要额外包含对应的头文件以及加载响应的动态库：

```c
// 使用包含的头文件
include <winsock2.h>
// 使用的套接字库
ws2_32.dll
```

在Windows中使用套接字需要先加载套接字库（套接字环境），最后需要释放套接字资源。

```c++
// 初始化Winsock库
// 返回值: 成功返回0，失败返回SOCKET_ERROR。
WSAStartup(WORD wVersionRequested, LPWSADATA lpWSAData);
```
- 参数:
  - wVersionRequested: 使用的Windows Socket的版本, 一般使用的版本是 2.2
    - 初始化这个 `MAKEWORD(2, 2);`参数
    - lpWSAData：一个WSADATA结构指针, 这是一个传入参数
    - 创建一个 WSADATA 类型的变量, 将地址传递给该函数的第二个参数

注销Winsock相关库，函数调用成功返回0，失败返回 SOCKET\_ERROR。

```c++
int WSACleanup (void);
```

使用举例：

```c++
WSAData wsa;
// 初始化套接字库
WSAStartup(MAKEWORD(2, 2), &wsa);

// .......

// 注销Winsock相关库
WSACleanup();
```

## 5.2 套接字通信函数

> 基于Linux的套接字通信流程是最全面的一套通信流程，如果是在某个框架中进行套接字通信，通信流程只会更简单，直接使用window的套接字api进行套接字通信，和Linux平台上的通信流程完全相同。

### 5.2.1 结构体

```c
///////////////////////////////////////////////////////////////////////
/////////////////////////////// Windows ///////////////////////////////
///////////////////////////////////////////////////////////////////////
typedef struct in_addr {
　　union {
　　    struct{ unsigned char s_b1,s_b2, s_b3,s_b4;} S_un_b;
　　    struct{ unsigned short s_w1, s_w2;} S_un_w;
　　    unsigned long S_addr;    // 存储IP地址
　　} S_un;
}IN_ADDR;

struct sockaddr_in {
　　short int sin_family; /* Address family */
　　unsigned short int sin_port; /* Port number */
　　struct in_addr sin_addr; /* Internet address */
　　unsigned char sin_zero[8]; /* Same size as struct sockaddr */
};

///////////////////////////////////////////////////////////////////////
//////////////////////////////// Linux ////////////////////////////////
///////////////////////////////////////////////////////////////////////
typedef unsigned short  uint16_t;
typedef unsigned int    uint32_t;
typedef uint16_t in_port_t;
typedef uint32_t in_addr_t;
typedef unsigned short int sa_family_t;

struct in_addr
{
    in_addr_t s_addr;
};

// sizeof(struct sockaddr) == sizeof(struct sockaddr_in)
struct sockaddr_in
{
    sa_family_t sin_family;     /* 地址族协议: AF_INET */
    in_port_t sin_port;         /* 端口, 2字节-> 大端  */
    struct in_addr sin_addr;    /* IP地址, 4字节 -> 大端  */
    /* 填充 8字节 */
    unsigned char sin_zero[sizeof (struct sockaddr) - sizeof(sin_family) -
                      sizeof (in_port_t) - sizeof (struct in_addr)];
};
```

### 5.2.2 大小端转换函数

```c
// 主机字节序 -> 网络字节序
u_short htons (u_short hostshort );
u_long htonl ( u_long hostlong);

// 网络字节序 -> 主机字节序
u_short ntohs (u_short netshort );
u_long ntohl ( u_long netlong);

// linux函数, window上没有这两个函数
inet_ntop();
inet_pton();

// windows 和 linux 都使用, 只能处理ipv4的ip地址
// 点分十进制IP -> 大端整形
unsigned long inet_addr (const char FAR * cp);    // windows
in_addr_t     inet_addr (const char *cp);            // linux

// 大端整形 -> 点分十进制IP
// window, linux相同
char* inet_ntoa(struct in_addr in);
```

### 5.2.3 套接字函数

> `window的api中套接字对应的类型是 SOCKET 类型, linux中是 int 类型, 本质是一样的`

```c
// 创建一个套接字
// 返回值: 成功返回套接字, 失败返回INVALID_SOCKET
SOCKET socket(int af,int type,int protocal);
参数:
    - af: 地址族协议
        - ipv4: AF_INET (windows/linux)
        - PF_INET (windows)
        - AF_INET == PF_INET
   - type: 和linux一样
           - SOCK_STREAM
        - SOCK_DGRAM
   - protocal: 一般写0 即可
       - 在windows上的另一种写法
           - IPPROTO_TCP, 使用指定的流式协议中的tcp协议
           - IPPROTO_UDP, 使用指定的报式协议中的udp协议

 // 关键字: FAR NEAR, 这两个关键字在32/64位机上是没有意义的, 指定的内存的寻址方式
// 套接字绑定本地IP和端口
// 返回值: 成功返回0，失败返回SOCKET_ERROR
int bind(SOCKET s,const struct sockaddr FAR* name, int namelen);

// 设置监听
// 返回值: 成功返回0，失败返回SOCKET_ERROR
int listen(SOCKET s,int backlog);

// 等待并接受客户端连接
// 返回值: 成功返回用于的套接字，失败返回INVALID_SOCKET。
SOCKET accept ( SOCKET s, struct sockaddr FAR* addr, int FAR* addrlen );

// 连接服务器
// 返回值: 成功返回0，失败返回SOCKET_ERROR
int connect (SOCKET s,const struct sockaddr FAR* name,int namelen );

// 在Qt中connect用户信号槽的连接, 如果要使用windows api 中的 connect 需要在函数名前加::
::connect(sock, (struct sockaddr*)&addr, sizeof(addr));

// 接收数据
// 返回值: 成功时返回接收的字节数，收到EOF时为0，失败时返回SOCKET_ERROR。
//        ==0 代表对方已经断开了连接
int recv (SOCKET s,char FAR* buf,int len,int flags);

// 发送数据
// 返回值: 成功返回传输字节数，失败返回SOCKET_ERROR。
int send (SOCKET s,const char FAR * buf, int len,int flags);

// 关闭套接字
// 返回值: 成功返回0，失败返回SOCKET_ERROR
int closesocket (SOCKET s);        // 在linux中使用的函数是: int close(int fd);

//----------------------- udp 通信函数 -------------------------
// 接收数据
int recvfrom(SOCKET s,char FAR *buf,int len,int flags,
         struct sockaddr FAR *from,int FAR *fromlen);
// 发送数据
int sendto(SOCKET s,const char FAR *buf,int len,int flags,
       const struct sockaddr FAR *to,int tolen);
```
