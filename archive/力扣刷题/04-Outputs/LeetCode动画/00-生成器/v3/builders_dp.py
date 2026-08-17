"""Deterministic dynamic-programming and recurrence traces."""

from __future__ import annotations

from math import isqrt
from typing import Any, Callable

from series_core import Lines, complete_state, event, make_trace


def _trace(item: dict, scene: str, events: list[dict], example: tuple[str, str], expected: Any, *, algorithm: str, invariant: str, aha: str, time: str, space: str, input_data: Any) -> dict:
    return make_trace(item, scene, events, algorithm=algorithm, invariant=invariant, aha=aha, time=time, space=space, example_text=example[0], expected_text=example[1], input_data=input_data, expected=expected)


def _dp(action: str, values: list[Any], variables: dict, *, active: list[int] | None = None, compared: list[int] | None = None, result: list[int] | None = None, formula: str = "", output: Any = None, status: str = "running") -> dict:
    state=complete_state("dp-table",action,values=values,variables=variables,active=active or [],compared=compared or [],result=result or [],formula=formula,status=status)
    if output is not None: state["output"]=output
    return state


def _matrix(action: str, matrix: list[list[Any]], variables: dict, *, active: list[str] | None = None, compared: list[str] | None = None, result: list[str] | None = None, formula: str = "", output: Any = None, status: str = "running") -> dict:
    state=complete_state("dp-table",action,matrix=matrix,variables=variables,activeCells=active or [],comparedCells=compared or [],resultCells=result or [],formula=formula,status=status)
    if output is not None: state["output"]=output
    return state


def build_70(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code); n=5;a=b=1;values=[1,1,None,None,None,None];events=[event(line.id("int a = 1, b = 1"),_dp("初始化 f[0]=f[1]=1",values,{"n":n,"a":a,"b":b},active=[0,1],formula="f[0]=f[1]=1"),"0 阶与 1 阶各有一种走法。",phase="setup")]
    remaining=n
    step=1
    while remaining-1:
        remaining-=1; c=a+b; step+=1; values[step]=c
        events.append(event(line.id("int c = a + b"),_dp(f"计算 f[{step}]={c}",values,{"n":remaining,"a":a,"b":b,"c":c},active=[step],compared=[step-1,step-2],formula=f"{a}+{b}={c}"),"最后一步只能来自前一阶或前两阶。",phase="mutate"))
        a,b=b,c
        events.append(event(line.id("a = b, b = c"),_dp("滚动保存最近两个状态",values,{"n":remaining,"a":a,"b":b},active=[step],formula=f"a={a}, b={b}"),"更早状态不再参与后续递推。",phase="inspect"))
    events.append(event(line.id("return b"),_dp("返回 5 阶楼梯方法数 8",values,{"a":a,"b":b},result=[5],formula="return 8",output=b,status="return"),"f[5]=8。",phase="return"))
    return _trace(item,"dp-table",events,example,8,algorithm="斐波那契滚动递推",invariant="a,b 始终是相邻两阶的方法数",aha="最后一步来自 1 阶或 2 阶",time="O(n)",space="O(1)",input_data=n)


def build_118(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code); n=5; triangle=[]; events=[event(line.id("vector<vector<int>> f"),_matrix("建立空的杨辉三角",[],{"i":None,"j":None,"n":n}),"每一行只依赖上一行。",phase="setup")]
    for i in range(n):
        row=[0]*(i+1);row[0]=row[-1]=1
        events.append(event(line.id("line[0] = line[i] = 1"),_matrix(f"第 {i+1} 行两端置 1",triangle+[row.copy()],{"i":i,"j":None},active=[f"{i},0",f"{i},{i}"],formula="edge=1"),"边界位置只有一条来源。",phase="mutate"))
        for j in range(1,i):
            row[j]=triangle[i-1][j-1]+triangle[i-1][j]
            events.append(event(line.id("line[j] = f[i - 1]"),_matrix(f"计算第 {i+1} 行第 {j+1} 项 {row[j]}",triangle+[row.copy()],{"i":i,"j":j},active=[f"{i},{j}"],compared=[f"{i-1},{j-1}",f"{i-1},{j}"],formula=f"{triangle[i-1][j-1]}+{triangle[i-1][j]}={row[j]}"),"内部元素等于左上与右上之和。",phase="mutate"))
        triangle.append(row)
        events.append(event(line.id("f.push_back(line)"),_matrix(f"确认第 {i+1} 行",triangle,{"i":i},result=[f"{i},{j}" for j in range(i+1)],formula=str(row)),"整行计算完成后再加入结果。",phase="accept"))
    events.append(event(line.id("return f"),_matrix("返回前 5 行杨辉三角",triangle,{"rows":n},result=[f"4,{j}" for j in range(5)],formula=str(triangle[-1]),output=triangle,status="return"),"第 5 行为 [1,4,6,4,1]。",phase="return"))
    return _trace(item,"dp-table",events,example,triangle,algorithm="逐行二维递推",invariant="开始第 i 行时前 i 行已经完整正确",aha="内部值只依赖上一行相邻两项",time="O(n²)",space="O(n²)",input_data=n)


def build_198(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code);nums=[2,7,9,3,1];n=len(nums);f=[0]*(n+1);g=[0]*(n+1);events=[event(line.id("vector<int> f"),_dp("初始化抢与不抢两类状态",["f0=0/g0=0"]+[None]*n,{"i":0}),"f 表示抢当前屋，g 表示不抢当前屋。",phase="setup")]
    for i in range(1,n+1):
        f[i]=g[i-1]+nums[i-1]
        events.append(event(line.id("f[i] = g[i - 1]"),_dp(f"抢第 {i} 间：f[{i}]={f[i]}",[f"{f[k]}/{g[k]}" for k in range(n+1)],{"i":i,"house":nums[i-1],"f":f[i],"g":g[i]},active=[i],compared=[i-1],formula=f"g[{i-1}] {g[i-1]} + {nums[i-1]} = {f[i]}"),"抢当前屋则上一间必须不抢。",phase="mutate"))
        g[i]=max(f[i-1],g[i-1])
        events.append(event(line.id("g[i] = max"),_dp(f"不抢第 {i} 间：g[{i}]={g[i]}",[f"{f[k]}/{g[k]}" for k in range(n+1)],{"i":i,"f":f[i],"g":g[i]},active=[i],compared=[i-1],formula=f"max({f[i-1]},{g[i-1]})={g[i]}"),"不抢当前屋可继承上一间两种状态中的较大者。",phase="mutate"))
    answer=max(f[n],g[n])
    events.append(event(line.id("return max(f[n]"),_dp("返回最大金额 12",[f"{f[k]}/{g[k]}" for k in range(n+1)],{"f[n]":f[n],"g[n]":g[n]},result=[n],formula=f"max({f[n]},{g[n]})={answer}",output=answer,status="return"),"选择房屋 1、3、5 得到 12。",phase="return"))
    return _trace(item,"dp-table",events,example,12,algorithm="抢/不抢双状态 DP",invariant="f[i],g[i] 分别覆盖前 i 间且固定第 i 间决策",aha="相邻约束只需要保留上一间两种状态",time="O(n)",space="O(n)",input_data=nums)


def build_279(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code); original=12;n=original;events=[event(line.id("if (check(n))"),complete_state("generic-array","先判断 12 是否为完全平方数",values=[1,4,9],variables={"n":n,"r":isqrt(n)},active=[],formula="3² != 12"),"若本身为平方数答案直接是 1。",phase="setup")]
    for a in range(1,isqrt(n)+1):
        rest=n-a*a; square=isqrt(rest)**2==rest
        events.append(event(line.id("if (check(n - a * a))"),complete_state("generic-array",f"尝试 {a}²，剩余 {rest}",values=[a*a,rest],variables={"n":n,"a":a,"rest":rest},active=[0],compared=[1],formula=f"sqrt({rest}) integer → {square}"),"若剩余也是平方数，答案为 2。",phase="compare"))
    while n%4==0:
        old=n;n//=4
        events.append(event(line.id("while (n % 4 == 0)"),complete_state("generic-array",f"按四平方定理约去因子 4：{old}→{n}",values=[n],variables={"n":n},formula=f"{old}/4={n}"),"乘 4 不改变所需平方数个数的判别。",phase="mutate"))
    answer=3 if n%8!=7 else 4
    events.append(event(line.id("if (n % 8 != 7) return 3"),complete_state("generic-array","3 mod 8 != 7，答案为 3",values=[4,4,4],variables={"n":n,"n%8":n%8},result=[0,1,2],formula="12=4+4+4",output=answer,status="return"),"勒让德三平方定理排除 4，且前面已排除 1 和 2。",phase="return"))
    return _trace(item,"generic-array",events,example,3,algorithm="平方判定 + 四平方定理",invariant="每个分支按 1、2、3、4 的可能性依次排除",aha="排除一平方和两平方后，用 n=4^a(8b+7) 判定是否必须四个",time="O(√n)",space="O(1)",input_data=original)


def build_139(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code);s="leetcode";words={"leet","code"};n=len(s);f=[False]*(n+1);f[0]=True;events=[event(line.id("f[0] = true"),_dp("空前缀可以被拆分",f,{"i":0,"j":None},active=[0],formula="f[0]=true"),"它是后续匹配单词的起点。",phase="setup")]
    for i in range(n):
        events.append(event(line.id("if (f[i])"),_dp(f"检查前缀位置 {i} 是否可达",f,{"i":i,"reachable":f[i]},active=[i],formula=f"f[{i}]={f[i]}"),"只有可拆分前缀才能继续向后扩展。",phase="compare"))
        if not f[i]: continue
        for j in range(i+1,n+1):
            token=s[i:j];hit=token in words
            events.append(event(line.id("if (hash.count(h))"),_dp(f"检查子串 {token}",f,{"i":i,"j":j,"word":token},active=[j],compared=[i],formula=f"dict contains {token} → {hit}"),"哈希值代表当前从 i 开始的子串。",phase="compare"))
            if hit:
                f[j]=True
                events.append(event(line.id("f[j] = true"),_dp(f"单词 {token} 使 f[{j}]=true",f,{"i":i,"j":j,"word":token},active=[j],compared=[i],formula=f"f[{j}]=true"),"可达前缀加一个字典单词仍可拆分。",phase="mutate"))
    events.append(event(line.id("return f[n]"),_dp("返回 leetcode 可以拆分",f,{"n":n},result=[n],formula="leet + code",output=f[n],status="return"),"位置 4 和 8 依次被字典单词连接。",phase="return"))
    return _trace(item,"dp-table",events,example,True,algorithm="可达前缀 DP + 字符串哈希",invariant="f[j] 仅在存在可达 i 且 s[i:j] 在字典时为真",aha="把拆分问题转成前缀位置之间的可达性",time="O(n²)",space="O(n+|dict|)",input_data={"s":s,"dict":sorted(words)})


def build_300(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code);nums=[10,9,2,5,3,7,101,18];tails=[];events=[event(line.id("vector<int> q"),complete_state("stack-sequence","tails 为空",values=nums,heap=[],variables={"i":None},output=[]),"tails[len-1] 保存长度 len 递增子序列的最小尾值。",phase="setup")]
    for i,x in enumerate(nums):
        if not tails or x>tails[-1]:
            tails.append(x);needle="q.push_back(x)";action=f"{x} 大于尾值，LIS 长度扩为 {len(tails)}"
        else:
            l,r=0,len(tails)-1
            if x<=tails[0]:r=0
            else:
                while l<r:
                    mid=(l+r+1)//2
                    events.append(event(line.id("if (q[mid] < x)"),complete_state("stack-sequence",f"二分 tails：{tails[mid]} < {x}",values=nums,heap=tails.copy(),variables={"i":i,"x":x,"l":l,"r":r,"mid":mid},active=[i],formula=f"{tails[mid]} < {x} → {tails[mid]<x}"),"寻找最后一个小于 x 的尾值。",phase="compare"))
                    if tails[mid]<x:l=mid
                    else:r=mid-1
                r=l+1
            tails[r]=x;needle="q[r + 1] = x" if r else "q[0] = x";action=f"用 {x} 降低长度 {r+1} 的最小尾值"
        events.append(event(line.id(needle),complete_state("stack-sequence",action,values=nums,heap=tails.copy(),variables={"i":i,"x":x,"length":len(tails)},active=[i],activeHeap=[x],output=tails.copy(),formula=str(tails)),"替换尾值不会改变已有长度，只为后续延伸留更大空间。",phase="mutate"))
    events.append(event(line.id("return q.size()"),complete_state("stack-sequence","返回 LIS 长度 4",values=nums,heap=tails,variables={"length":len(tails)},result=[2,4,5,7],formula=str(tails),output=len(tails),status="return"),"tails 长度就是最长递增子序列长度。",phase="return"))
    return _trace(item,"stack-sequence",events,example,4,algorithm="贪心最小尾值 + 二分",invariant="tails 严格递增且每个长度对应尾值最小",aha="降低尾值不损失长度，却提高未来接续机会",time="O(n log n)",space="O(n)",input_data=nums)


def build_152(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code);nums=[2,3,-2,4];f=g=best=nums[0];values=[f"{f}/{g}"]+[None]*3;events=[event(line.id("int f = nums[0]"),_dp("最大积与最小积都从 2 开始",values,{"i":0,"f":f,"g":g,"res":best},active=[0]),"负数会交换最大与最小角色，因此必须同时维护。",phase="setup")]
    for i in range(1,len(nums)):
        a=nums[i];fa=f*a;ga=g*a
        events.append(event(line.id("int a = nums[i]"),_dp(f"计算三个候选 {a},{fa},{ga}",values,{"i":i,"a":a,"fa":fa,"ga":ga,"f":f,"g":g,"res":best},active=[i],compared=[i-1],formula=f"a={a}, f×a={fa}, g×a={ga}"),"当前最优可能单独从 a 重启。",phase="compare"))
        f=max(a,fa,ga);g=min(a,fa,ga);best=max(best,f);values[i]=f"{f}/{g}"
        events.append(event([line.id("f = max"),line.id("g = min"),line.id("res = max")],_dp(f"更新最大积 {f}、最小积 {g}、答案 {best}",values,{"i":i,"f":f,"g":g,"res":best},active=[i],formula=f"f={f}, g={g}, res={best}"),"每个位置保存完整的最大/最小结尾乘积。",phase="mutate"))
    events.append(event(line.id("return res"),_dp("返回最大乘积 6",values,{"res":best},result=[1],formula="2×3=6",output=best,status="return"),"最优子数组为 [2,3]。",phase="return"))
    return _trace(item,"dp-table",events,example,6,algorithm="最大/最小乘积双状态",invariant="f,g 是必须以 i 结尾的最大与最小乘积",aha="乘负数时历史最小积可能变成最大积",time="O(n)",space="O(1)",input_data=nums)


def build_416(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code);nums=[1,5,11,5];target=sum(nums)//2;f=[0]*(target+1);f[0]=1;events=[event(line.id("f[0] = 1"),_dp("容量 0 可达",f,{"x":None,"j":0,"m":target},active=[0],formula="f[0]=1"),"目标是选出总和 11 的子集。",phase="setup")]
    for x in nums:
        for j in range(target,x-1,-1):
            before=f[j];f[j]|=f[j-x]
            events.append(event(line.id("f[j] |= f[j - x]"),_dp(f"用数字 {x} 更新容量 {j}",f,{"x":x,"j":j,"m":target},active=[j],compared=[j-x],formula=f"{before} OR f[{j-x}]={f[j-x]} → {f[j]}"),"倒序保证每个数字最多使用一次。",phase="mutate"))
    answer=bool(f[target])
    events.append(event(line.id("return f[m]"),_dp("容量 11 可达，返回 true",f,{"m":target},result=[target],formula="subset [11] or [1,5,5]",output=answer,status="return"),"总和的一半可达，因此剩余元素也恰好为另一半。",phase="return"))
    return _trace(item,"dp-table",events,example,True,algorithm="0/1 背包可达性",invariant="处理前若干数字后，f[j] 表示容量 j 是否可达",aha="等和分割等价于寻找总和一半的子集",time="O(n·sum)",space="O(sum)",input_data=nums)


def build_32(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code);s="(()";stack=[];start=-1;best=0;events=[event(line.id("stack<int> stk"),complete_state("stack-sequence","栈为空，非法边界 start=-1",values=list(s),stack=[],variables={"i":None,"start":start,"res":best}),"栈保存尚未匹配的左括号下标。",phase="setup")]
    for i,ch in enumerate(s):
        if ch=='(':
            stack.append(i);needle="stk.push(i)";action=f"左括号下标 {i} 入栈"
        elif stack:
            stack.pop();needle="stk.pop()";action=f"右括号 {i} 匹配并弹栈"
        else:
            start=i;needle="start = i";action=f"无法匹配，start 更新为 {i}"
        events.append(event(line.id(needle),complete_state("stack-sequence",action,values=list(s),stack=stack.copy(),variables={"i":i,"start":start,"res":best},active=[i],formula=f"stack={stack}"),"start 与栈顶共同界定当前合法后缀。",phase="mutate"))
        if ch==')' and start!=i:
            length=i-(stack[-1] if stack else start);best=max(best,length)
            events.append(event(line.id("res = max",occurrence=1 if stack else 2),complete_state("stack-sequence",f"合法后缀长度 {length}，答案 {best}",values=list(s),stack=stack.copy(),variables={"i":i,"start":start,"res":best},result=list(range(i-length+1,i+1)),formula=f"{i}-{'top' if stack else start}={length}"),"有未匹配左括号时从栈顶后开始，否则从 start 后开始。",phase="accept"))
    events.append(event(line.id("return res"),complete_state("stack-sequence","返回最长有效括号长度 2",values=list(s),stack=stack,variables={"start":start,"res":best},result=[1,2],formula="() length=2",output=best,status="return"),"最后两个字符组成最长合法段。",phase="return"))
    return _trace(item,"stack-sequence",events,example,2,algorithm="未匹配下标栈",invariant="栈保存当前非法边界之后未匹配的左括号",aha="栈空时长度从 start 算，非空时从栈顶算",time="O(n)",space="O(n)",input_data=s)


def build_62(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code);rows,cols=3,7;f=[[0]*cols for _ in range(rows)];events=[event(line.id("vector<vector<int>> f"),_matrix("建立 3×7 路径表",f,{"i":None,"j":None}),"每格路径数来自上方与左方。",phase="setup")]
    for i in range(rows):
        for j in range(cols):
            if i==0 and j==0:f[i][j]=1;needle="if (!i && !j)"
            else:
                if i:f[i][j]+=f[i-1][j]
                if j:f[i][j]+=f[i][j-1]
                needle="if (i) f[i][j]"
            deps=[]
            if i:deps.append(f"{i-1},{j}")
            if j:deps.append(f"{i},{j-1}")
            events.append(event(line.id(needle),_matrix(f"写入 f[{i}][{j}]={f[i][j]}",f,{"i":i,"j":j},active=[f"{i},{j}"],compared=deps,formula=" + ".join(str(f[int(x.split(',')[0])][int(x.split(',')[1])]) for x in deps) or "1"),"当前位置只依赖已经完成的上方与左方。",phase="mutate"))
    events.append(event(line.id("return f[n - 1]"),_matrix("返回不同路径数 28",f,{"i":2,"j":6},result=["2,6"],formula="f[2][6]=28",output=28,status="return"),"右下角汇总全部路径。",phase="return"))
    return _trace(item,"dp-table",events,example,28,algorithm="网格路径二维 DP",invariant="按行扫描时上方和左方状态均已确定",aha="最后一步只能从上或左进入",time="O(mn)",space="O(mn)",input_data={"m":3,"n":7})


def build_64(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code);grid=[[1,3,1],[1,5,1],[4,2,1]];rows=cols=3;inf=10**9;f=[[inf]*cols for _ in range(rows)];events=[event(line.id("vector<vector<int>> f"),_matrix("DP 表初始化为无穷",f,{"i":None,"j":None}),"尚未可达的位置不能参与最小值。",phase="setup")]
    for i in range(rows):
        for j in range(cols):
            if i==j==0:f[i][j]=grid[i][j];needle="if (!i && !j)"
            else:
                candidates=[]
                if i:candidates.append(f[i-1][j])
                if j:candidates.append(f[i][j-1])
                f[i][j]=min(candidates)+grid[i][j];needle="if (i) f[i][j]"
            deps=[]
            if i:deps.append(f"{i-1},{j}")
            if j:deps.append(f"{i},{j-1}")
            events.append(event(line.id(needle),_matrix(f"写入最小路径和 f[{i}][{j}]={f[i][j]}",f,{"i":i,"j":j,"cost":grid[i][j]},active=[f"{i},{j}"],compared=deps,formula=f"min(parent)+{grid[i][j]}={f[i][j]}"),"只选择上方和左方中代价较小的路径。",phase="mutate"))
    events.append(event(line.id("return f[n - 1]"),_matrix("返回最小路径和 7",f,{"i":2,"j":2},result=["2,2"],formula="1+3+1+1+1=7",output=7,status="return"),"右下角状态为全局答案。",phase="return"))
    return _trace(item,"dp-table",events,example,7,algorithm="网格最短路径 DP",invariant="f[i][j] 是到当前格的最小累计代价",aha="每格只需比较两个已确定前驱",time="O(mn)",space="O(mn)",input_data=grid)


def build_5(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code);s="babad";best="";best_range=[];events=[event(line.id("string res"),complete_state("array-pointers","答案字符串为空",values=list(s),variables={"i":None,"l":None,"r":None,"res":""}),"每个回文都有一个字符中心或缝隙中心。",phase="setup")]
    for i in range(len(s)):
        for even in (False,True):
            l,r=(i,i+1) if even else (i-1,i+1)
            events.append(event(line.id("l = i, r = i + 1" if even else "int l = i - 1"),complete_state("array-pointers",f"从{'偶数' if even else '奇数'}中心 {i} 扩展",values=list(s),variables={"i":i,"l":l,"r":r,"res":best},pointers={"l":l,"r":r},formula=f"center={i}"),"左右指针同步外扩。",phase="inspect"))
            while l>=0 and r<len(s) and s[l]==s[r]:
                events.append(event(line.id("while (l >= 0",occurrence=2 if even else 1),complete_state("array-pointers",f"{s[l]}={s[r]}，回文继续扩展",values=list(s),variables={"i":i,"l":l,"r":r,"res":best},pointers={"l":l,"r":r},compared=[l,r],result=list(range(l,r+1)),formula=f"s[{l}]==s[{r}]"),"相等时当前闭区间仍是回文。",phase="compare"));l-=1;r+=1
            candidate=s[l+1:r]
            if len(candidate)>len(best):best=candidate;best_range=[l+1,r-1]
            events.append(event(line.id("if (res.size() <",occurrence=2 if even else 1),complete_state("array-pointers",f"候选 {candidate or '空'}，最佳 {best}",values=list(s),variables={"i":i,"l":l,"r":r,"res":best},pointers={"l":l,"r":r},result=list(range(best_range[0],best_range[1]+1)) if best_range else [],formula=f"length={len(candidate)}"),"扩展失败后的内部区间是该中心最长回文。",phase="accept"))
    events.append(event(line.id("return res"),complete_state("array-pointers",f"返回最长回文 {best}",values=list(s),variables={"res":best},result=list(range(best_range[0],best_range[1]+1)),formula=best,output=best,status="return"),"首次长度 3 的最优解为 bab。",phase="return"))
    return _trace(item,"array-pointers",events,example,best,algorithm="枚举中心向两侧扩展",invariant="每次扩展前内部区间已经是回文",aha="奇偶回文分别对应字符中心与缝隙中心",time="O(n²)",space="O(1)",input_data=s)


def build_1143(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code);a="abcde";b="ace";f=[[0]*(len(b)+1) for _ in range(len(a)+1)];events=[event(line.id("vector<vector<int>> f"),_matrix("建立 LCS DP 表",f,{"i":0,"j":0}),"空串与任意串的公共子序列长度为 0。",phase="setup")]
    for i in range(1,len(a)+1):
        for j in range(1,len(b)+1):
            f[i][j]=max(f[i-1][j],f[i][j-1]);equal=a[i-1]==b[j-1]
            if equal:f[i][j]=max(f[i][j],f[i-1][j-1]+1)
            deps=[f"{i-1},{j}",f"{i},{j-1}"]+([f"{i-1},{j-1}"] if equal else [])
            events.append(event([line.id("f[i][j] = max"),line.id("if (a[i - 1] ==")],_matrix(f"比较 {a[i-1]} 与 {b[j-1]}，f[{i}][{j}]={f[i][j]}",f,{"i":i,"j":j,"a":a[i-1],"b":b[j-1]},active=[f"{i},{j}"],compared=deps,formula=f"equal={equal} → {f[i][j]}"),"不相等时丢弃一侧，相等时还可连接左上状态。",phase="mutate"))
    answer=f[-1][-1]
    events.append(event(line.id("return f[n][m]"),_matrix("返回 LCS 长度 3",f,{"i":len(a),"j":len(b)},result=[f"{len(a)},{len(b)}"],formula="ace length=3",output=answer,status="return"),"公共子序列 ace 长度为 3。",phase="return"))
    return _trace(item,"dp-table",events,example,3,algorithm="二维最长公共子序列 DP",invariant="f[i][j] 覆盖 a 前 i 个与 b 前 j 个字符",aha="字符相等时可从左上角加一",time="O(nm)",space="O(nm)",input_data={"a":a,"b":b})


def build_72(item: dict, code: str, example: tuple[str,str]) -> dict:
    line=Lines(code);a="horse";b="ros";n=len(a);m=len(b);f=[[0]*(m+1) for _ in range(n+1)];events=[]
    for i in range(n+1):f[i][0]=i
    for j in range(m+1):f[0][j]=j
    events.append(event([line.id("f[i][0] = i"),line.id("f[0][i] = i")],_matrix("初始化空串边界",f,{"i":0,"j":0},result=[f"{i},0" for i in range(n+1)]+[f"0,{j}" for j in range(m+1)],formula="delete i / insert j"),"变成空串只能全删，从空串变来只能全插。",phase="setup"))
    for i in range(1,n+1):
        for j in range(1,m+1):
            insert_delete=min(f[i-1][j],f[i][j-1])+1;t=0 if a[i-1]==b[j-1] else 1
            f[i][j]=min(insert_delete,f[i-1][j-1]+t)
            events.append(event([line.id("f[i][j] = min(f[i - 1]"),line.id("f[i][j] = min(f[i][j]")],_matrix(f"把 {a[:i]} 变为 {b[:j]} 需要 {f[i][j]} 步",f,{"i":i,"j":j,"a":a[i-1],"b":b[j-1],"replaceCost":t},active=[f"{i},{j}"],compared=[f"{i-1},{j}",f"{i},{j-1}",f"{i-1},{j-1}"],formula=f"min(delete/insert={insert_delete}, diagonal={f[i-1][j-1]}+{t})={f[i][j]}"),"删除、插入、替换/匹配覆盖全部最后一步选择。",phase="mutate"))
    answer=f[n][m]
    events.append(event(line.id("return f[n][m]"),_matrix("返回编辑距离 3",f,{"i":n,"j":m},result=[f"{n},{m}"],formula="horse → ros = 3",output=answer,status="return"),"右下角是完整字符串之间的最少操作数。",phase="return"))
    return _trace(item,"dp-table",events,example,3,algorithm="二维编辑距离 DP",invariant="f[i][j] 是两个前缀之间的最小编辑次数",aha="枚举最后一次删除、插入或替换",time="O(nm)",space="O(nm)",input_data={"a":a,"b":b})


BUILDERS: dict[int, Callable[[dict,str,tuple[str,str]],dict]]={
    5:build_5,32:build_32,62:build_62,64:build_64,70:build_70,72:build_72,
    118:build_118,139:build_139,152:build_152,198:build_198,279:build_279,
    300:build_300,416:build_416,1143:build_1143,
}
