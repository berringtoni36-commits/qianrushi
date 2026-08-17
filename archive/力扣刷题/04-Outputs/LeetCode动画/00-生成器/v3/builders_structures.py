"""Deterministic matrix, graph, stack, monotonic-structure, and heap traces."""

from __future__ import annotations

from collections import Counter, deque
from copy import deepcopy
from heapq import heappop, heappush
from typing import Any, Callable

from series_core import Lines, complete_state, event, make_trace


def _trace(item:dict,scene:str,events:list[dict],example:tuple[str,str],expected:Any,*,algorithm:str,invariant:str,aha:str,time:str,space:str,input_data:Any)->dict:
    return make_trace(item,scene,events,algorithm=algorithm,invariant=invariant,aha=aha,time=time,space=space,example_text=example[0],expected_text=example[1],input_data=input_data,expected=expected)


def _grid(scene:str,action:str,matrix:list[list[Any]],variables:dict,*,active:list[str]=[],compared:list[str]=[],result:list[str]=[],queue:list[Any]|None=None,stack:list[Any]|None=None,output:Any=None,formula:str="",status:str="running")->dict:
    state=complete_state(scene,action,matrix=matrix,variables=variables,activeCells=active,comparedCells=compared,resultCells=result,formula=formula,status=status)
    if queue is not None: state["queue"]=queue
    if stack is not None: state["stack"]=stack
    if output is not None: state["output"]=output
    return state


def build_73(item,code,example):
    line=Lines(code);original=[[1,1,1],[1,0,1],[1,1,1]];a=deepcopy(original);r0=all(a[0]);c0=all(row[0] for row in a);events=[event(line.id("int r0 = 1"),_grid("matrix-grid","检查首行首列是否原本含零",a,{"r0":int(r0),"c0":int(c0)}),"首行首列同时充当标记区，必须先保存原状态。",phase="setup")]
    for r in range(1,3):
        for c in range(1,3):
            events.append(event(line.id("if (!matrix[j][i])"),_grid("matrix-grid",f"检查 ({r},{c})={a[r][c]}",a,{"r":r,"c":c,"r0":int(r0),"c0":int(c0)},active=[f"{r},{c}"],formula=f"zero={a[r][c]==0}"),"内部零会同时标记对应首行与首列。",phase="compare"))
            if a[r][c]==0:
                a[0][c]=0;a[r][0]=0
                events.append(event([line.id("matrix[0][i] = 0"),line.id("matrix[i][0] = 0")],_grid("matrix-grid","把第 1 行与第 1 列标为需清零",a,{"r":r,"c":c},active=[f"0,{c}",f"{r},0"],formula="row/col marker=0"),"标记阶段不立即清除其他单元格。",phase="mutate"))
    marked_rows=[r for r in range(1,3) if a[r][0]==0];marked_cols=[c for c in range(1,3) if a[0][c]==0]
    for c in marked_cols:
        for r in range(3):a[r][c]=0
        events.append(event(line.id("matrix[j][i] = 0"),_grid("matrix-grid",f"按标记清零第 {c} 列",a,{"column":c},result=[f"{r},{c}" for r in range(3)]),"列标记转化为真实清零。",phase="mutate"))
    for r in marked_rows:
        for c in range(3):a[r][c]=0
        events.append(event(line.id("matrix[i][j] = 0"),_grid("matrix-grid",f"按标记清零第 {r} 行",a,{"row":r},result=[f"{r},{c}" for c in range(3)]),"行标记转化为真实清零。",phase="mutate"))
    if not r0:a[0]=[0]*3
    if not c0:
        for r in range(3):a[r][0]=0
    events.append(event(line.id("if (!r0)","if (!c0)"),_grid("matrix-grid","矩阵置零完成",a,{"r0":int(r0),"c0":int(c0)},result=[f"{r},{c}" for r in range(3) for c in range(3) if a[r][c]==0],output=a,formula=str(a),status="return"),"首行首列按保存的原始标志最后处理。",phase="return"))
    return _trace(item,"matrix-grid",events,example,a,algorithm="首行首列原地标记",invariant="标记阶段首行/首列准确记录需清零的行列",aha="复用矩阵边界作为 O(1) 标记空间",time="O(mn)",space="O(1)",input_data=original)


def build_54(item,code,example):
    line=Lines(code);a=[[1,2,3],[4,5,6],[7,8,9]];seen=[[False]*3 for _ in range(3)];dirs=[(0,1),(1,0),(0,-1),(-1,0)];x=y=d=0;out=[];events=[event(line.id("int dx[]"),_grid("matrix-grid","从左上角向右开始",a,{"x":0,"y":0,"d":"右"},result=[]),"方向只在下一格越界或已访问时旋转。",phase="setup")]
    for step in range(9):
        out.append(a[x][y]);seen[x][y]=True
        events.append(event([line.id("res.push_back"),line.id("st[x][y] = true")],_grid("matrix-grid",f"访问 ({x},{y})，输出 {a[x][y]}",a,{"x":x,"y":y,"d":d,"step":step},active=[f"{x},{y}"],result=[f"{r},{c}" for r in range(3) for c in range(3) if seen[r][c]],output=out.copy(),formula=str(out)),"每个格子只访问一次。",phase="accept"))
        nx,ny=x+dirs[d][0],y+dirs[d][1]
        if not(0<=nx<3 and 0<=ny<3) or seen[nx][ny]:
            d=(d+1)%4;nx,ny=x+dirs[d][0],y+dirs[d][1]
            events.append(event(line.id("d = (d + 1) % 4"),_grid("matrix-grid",f"前方受阻，顺时针转向 {d}",a,{"x":x,"y":y,"d":d},active=[f"{x},{y}"],formula=f"d={d}"),"转向后再计算下一坐标。",phase="mutate"))
        x,y=nx,ny
    events.append(event(line.id("return res"),_grid("matrix-grid","返回螺旋序列",a,{"count":9},result=[f"{r},{c}" for r in range(3) for c in range(3)],output=out,formula=str(out),status="return"),"九个格子恰好访问一次。",phase="return"))
    return _trace(item,"matrix-grid",events,example,out,algorithm="方向数组 + 访问标记",invariant="已输出格永久标记，当前位置下一步按顺时针规则选择",aha="只有碰墙或碰到已访问格时才转向",time="O(mn)",space="O(mn)",input_data=a)


def build_48(item,code,example):
    line=Lines(code);original=[[1,2,3],[4,5,6],[7,8,9]];a=deepcopy(original);events=[event(line.id("int n = matrix.size"),_grid("matrix-grid","先沿主对角线转置",a,{"n":3}),"顺时针旋转等价于转置后水平翻转。",phase="setup")]
    for i in range(3):
        for j in range(i):
            a[i][j],a[j][i]=a[j][i],a[i][j]
            events.append(event(line.id("swap(matrix[i][j], matrix[j][i])"),_grid("matrix-grid",f"交换 ({i},{j}) 与 ({j},{i})",a,{"i":i,"j":j},active=[f"{i},{j}",f"{j},{i}"],formula="transpose swap"),"每对非对角元素只交换一次。",phase="mutate"))
    for i in range(3):
        for j,k in [(0,2)]:
            a[i][j],a[i][k]=a[i][k],a[i][j]
            events.append(event(line.id("swap(matrix[i][j], matrix[i][k])"),_grid("matrix-grid",f"水平翻转第 {i} 行",a,{"i":i,"j":j,"k":k},active=[f"{i},{j}",f"{i},{k}"],formula="row reverse"),"转置后的每一行反转完成顺时针旋转。",phase="mutate"))
    events.append(event(line.id("swap(matrix[i][j], matrix[i][k])"),_grid("matrix-grid","旋转结果确认",a,{"n":3},result=[f"{r},{c}" for r in range(3) for c in range(3)],output=a,formula=str(a),status="return"),"每个原坐标 (r,c) 到达 (c,n-1-r)。",phase="return"))
    return _trace(item,"matrix-grid",events,example,a,algorithm="转置 + 行反转",invariant="每阶段都是原地双元素交换",aha="坐标变换 (r,c)→(c,n-1-r) 可拆成两次镜像",time="O(n²)",space="O(1)",input_data=original)


def build_240(item,code,example):
    line=Lines(code);a=[[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]];target=5;i=0;j=4;events=[event(line.id("int i = 0, j = m - 1"),_grid("matrix-grid","从右上角 15 开始",a,{"i":i,"j":j,"target":target},active=["0,4"]),"当前位置左边更小、下边更大，可一次排除整行或整列。",phase="setup")]
    found=False
    while i<5 and j>=0:
        t=a[i][j];events.append(event(line.id("int t = matrix[i][j]"),_grid("matrix-grid",f"比较 ({i},{j})={t} 与 {target}",a,{"i":i,"j":j,"t":t,"target":target},active=[f"{i},{j}"],formula=f"{t} vs {target}"),"矩阵行列都有序。",phase="compare"))
        if t==target:found=True;break
        if t>target:j-=1;needle="j --";action="值偏大，排除当前列"
        else:i+=1;needle="i ++";action="值偏小，排除当前行"
        events.append(event(line.id(needle),_grid("matrix-grid",action,a,{"i":i,"j":j,"target":target},active=[f"{i},{j}"],formula=f"next=({i},{j})"),"被排除区域不可能含 target。",phase="mutate"))
    events.append(event(line.id("return true"),_grid("matrix-grid","在 (1,1) 找到 5",a,{"i":i,"j":j,"target":target},active=[f"{i},{j}"],result=[f"{i},{j}"],output=found,formula="5==target",status="return"),"命中后立即返回 true。",phase="return"))
    return _trace(item,"matrix-grid",events,example,True,algorithm="右上角阶梯搜索",invariant="每步排除一整行或一整列且不丢失目标",aha="右上角同时具有横向变小、纵向变大的单调性",time="O(m+n)",space="O(1)",input_data={"matrix":a,"target":target})


def build_200(item,code,example):
    line=Lines(code);original=[list("11000"),list("11000"),list("00100"),list("00011")];g=deepcopy(original);count=0;events=[event(line.id("int cnt = 0"),_grid("matrix-grid","扫描网格寻找未访问陆地",g,{"i":0,"j":0,"cnt":0}),"每次发现 1 就沉没整个连通分量。",phase="setup")]
    def dfs(sr,sc):
        stack=[(sr,sc)]
        while stack:
            r,c=stack.pop()
            if not(0<=r<len(g) and 0<=c<len(g[0])) or g[r][c]!='1':continue
            g[r][c]='0'
            events.append(event(line.id("g[x][y] = '0'"),_grid("matrix-grid",f"沉没陆地 ({r},{c})",g,{"x":r,"y":c,"cnt":count},active=[f"{r},{c}"],stack=[f"{x},{y}" for x,y in stack],formula="1→0"),"访问即标零，防止重复进入。",phase="mutate"))
            stack.extend([(r-1,c),(r,c+1),(r+1,c),(r,c-1)])
    for r in range(len(g)):
        for c in range(len(g[0])):
            if g[r][c]=='1':
                events.append(event(line.id("if (g[i][j] == '1')"),_grid("matrix-grid",f"发现新岛屿起点 ({r},{c})",g,{"i":r,"j":c,"cnt":count},active=[f"{r},{c}"],formula="cell=1"),"此格未被此前 DFS 覆盖，因此属于新岛。",phase="inspect"));dfs(r,c);count+=1
                events.append(event(line.id("cnt ++"),_grid("matrix-grid",f"岛屿计数更新为 {count}",g,{"i":r,"j":c,"cnt":count},formula=f"cnt={count}"),"一个连通分量只计数一次。",phase="accept"))
    events.append(event(line.id("return cnt"),_grid("matrix-grid","返回岛屿数量 3",g,{"cnt":count},result=[f"{r},{c}" for r in range(len(g)) for c in range(len(g[0]))],output=count,formula="return 3",status="return"),"所有陆地均已沉没并归入三个分量。",phase="return"))
    return _trace(item,"matrix-grid",events,example,3,algorithm="网格 DFS 沉岛",invariant="变为 0 的陆地已被且只被一个岛屿访问",aha="发现一个 1 时一次 DFS 消费整个连通分量",time="O(mn)",space="O(mn)",input_data=original)


def build_994(item,code,example):
    line=Lines(code);original=[[2,1,1],[1,1,0],[0,1,1]];g=deepcopy(original);q=deque((r,c) for r in range(3) for c in range(3) if g[r][c]==2);minute=-1;events=[event(line.id("q.push({i, j})"),_grid("matrix-grid","所有腐烂橘子同时入队",g,{"minute":0},queue=[f"{r},{c}" for r,c in q],result=[f"{r},{c}" for r,c in q]),"多源 BFS 从全部初始腐烂点同时扩散。",phase="setup")]
    dirs=[(-1,0),(0,1),(1,0),(0,-1)]
    while q:
        minute+=1;size=len(q)
        events.append(event(line.id("res ++"),_grid("matrix-grid",f"进入第 {minute} 分钟",g,{"minute":minute,"layerSize":size},queue=[f"{r},{c}" for r,c in q],formula=f"layer={minute}"),"当前队列层代表同一分钟腐烂的橘子。",phase="inspect"))
        for _ in range(size):
            r,c=q.popleft()
            for dr,dc in dirs:
                nr,nc=r+dr,c+dc
                if 0<=nr<3 and 0<=nc<3 and g[nr][nc]==1:
                    g[nr][nc]=2;q.append((nr,nc))
                    events.append(event([line.id("g[x][y] = 2"),line.id("q.push({x, y})")],_grid("matrix-grid",f"橘子 ({nr},{nc}) 在第 {minute+1} 分钟腐烂",g,{"minute":minute+1,"x":nr,"y":nc},active=[f"{nr},{nc}"],queue=[f"{x},{y}" for x,y in q],formula="1→2"),"新腐烂橘子进入下一层，不能在本分钟二次传播。",phase="mutate"))
    answer=-1 if any(1 in row for row in g) else minute
    events.append(event(line.id("return res"),_grid("matrix-grid","全部橘子在 4 分钟腐烂",g,{"minute":minute},result=[f"{r},{c}" for r in range(3) for c in range(3) if g[r][c]==2],output=answer,formula="return 4",status="return"),"扫描确认没有剩余新鲜橘子。",phase="return"))
    return _trace(item,"matrix-grid",events,example,4,algorithm="多源分层 BFS",invariant="队列每一层恰好对应同一分钟新腐烂的橘子",aha="初始所有腐烂点同时作为第 0 层",time="O(mn)",space="O(mn)",input_data=original)


def build_207(item,code,example):
    line=Lines(code);n=2;edges=[[1,0]];graph={0:[1],1:[]};degree=[0,1];q=deque([0]);count=0;events=[event(line.id("q.push(i)"),complete_state("tree-graph","入度为 0 的课程 0 入队",values=[0,1],queue=[0],variables={"cnt":0},nodes=[{"id":"c0","value":"0 / d=0","level":0},{"id":"c1","value":"1 / d=1","level":1}],edges=[{"from":"c0","to":"c1"}],formula="d[0]=0"),"队列中课程当前没有未完成前置课。",phase="setup")]
    while q:
        t=q.popleft();count+=1
        events.append(event([line.id("q.pop()"),line.id("cnt ++")],complete_state("tree-graph",f"学习课程 {t}，完成数 {count}",values=[0,1],queue=list(q),variables={"t":t,"cnt":count},nodes=[{"id":"c0","value":f"0 / d={degree[0]}","level":0},{"id":"c1","value":f"1 / d={degree[1]}","level":1}],edges=[{"from":"c0","to":"c1","status":"active"}],active=[f"c{t}"],formula=f"cnt={count}"),"出队课程进入拓扑序。",phase="accept"))
        for nxt in graph[t]:
            degree[nxt]-=1
            if degree[nxt]==0:q.append(nxt)
            events.append(event(line.id("if ( -- d[i] == 0)"),complete_state("tree-graph",f"删除边 {t}→{nxt}，入度变 {degree[nxt]}",values=[0,1],queue=list(q),variables={"t":t,"next":nxt,"cnt":count},nodes=[{"id":"c0","value":f"0 / d={degree[0]}","level":0},{"id":"c1","value":f"1 / d={degree[1]}","level":1}],edges=[],active=[f"c{nxt}"],formula=f"d[{nxt}]={degree[nxt]}"),"入度归零时新课程可入队。",phase="mutate"))
    answer=count==n
    events.append(event(line.id("return cnt == n"),complete_state("tree-graph","两门课程全部进入拓扑序",values=[0,1],queue=[],variables={"cnt":count,"n":n},nodes=[{"id":"c0","value":"0","level":0},{"id":"c1","value":"1","level":1}],edges=[],result=["c0","c1"],output=answer,formula="2==2",status="return"),"没有环阻止课程入队。",phase="return"))
    return _trace(item,"tree-graph",events,example,True,algorithm="Kahn 拓扑排序",invariant="队列只含当前入度为 0 的未处理节点",aha="有向无环图一定能不断删除入度为 0 的节点",time="O(V+E)",space="O(V+E)",input_data={"n":n,"edges":edges})


def build_208(item,code,example):
    line=Lines(code);nodes={"root":{"id":"root","value":"root","level":0,"order":0}};edges=[];children={};events=[event(line.id("root = new Node"),complete_state("trie","创建 Trie 根节点",nodes=list(nodes.values()),edges=[],variables={"operation":"init"}),"根不代表字符，只提供所有单词入口。",phase="setup")]
    def insert(word):
        parent="root";prefix=""
        for depth,ch in enumerate(word,1):
            prefix+=ch;node=prefix
            if node not in nodes:
                nodes[node]={"id":node,"value":ch,"level":depth,"order":len(nodes)};edges.append({"from":parent,"to":node})
                events.append(event(line.id("if (!p->son[u])"),complete_state("trie",f"创建字符节点 {ch}",nodes=list(nodes.values()),edges=deepcopy(edges),variables={"operation":"insert","word":word,"char":ch,"prefix":prefix},active=[node],formula=f"new node {prefix}"),"缺失边才分配新节点。",phase="mutate"))
            parent=node
            events.append(event(line.id("p = p->son[u]"),complete_state("trie",f"沿字符 {ch} 走到前缀 {prefix}",nodes=list(nodes.values()),edges=deepcopy(edges),variables={"operation":"insert","word":word,"prefix":prefix},active=[node]),"指针始终对应已读前缀。",phase="inspect"))
        children[parent]=True;nodes[parent]["value"]+= " ✓"
        events.append(event(line.id("p->is_end = true"),complete_state("trie",f"标记单词 {word} 结束",nodes=list(nodes.values()),edges=deepcopy(edges),variables={"operation":"insert","word":word},result=[parent],formula="is_end=true"),"前缀节点只有结束标志为真才是完整单词。",phase="accept"))
    insert("apple");insert("app")
    for operation,word,expected in [("search","app",True),("startsWith","ap",True)]:
        parent="root";ok=True
        for ch in word:
            nxt=("" if parent=="root" else parent)+ch
            ok &= nxt in nodes;parent=nxt
            events.append(event(line.id("p = p->son[u]",occurrence=2 if operation=="search" else 3),complete_state("trie",f"{operation} 读取 {ch}",nodes=list(nodes.values()),edges=deepcopy(edges),variables={"operation":operation,"word":word,"prefix":parent},active=[parent],formula=f"edge exists={ok}"),"逐字符沿唯一边前进。",phase="compare"))
        result=ok and (children.get(parent,False) if operation=="search" else True)
        events.append(event(line.id("return p->is_end" if operation=="search" else "return true"),complete_state("trie",f"{operation}({word}) 返回 true",nodes=list(nodes.values()),edges=deepcopy(edges),variables={"operation":operation,"word":word},result=[parent],output=None,formula=str(result)),"search 还检查结束标志，startsWith 只要求路径存在。",phase="accept"))
    final=[True,True]
    events.append(event(line.id("return true"),complete_state("trie","search(app) 与 startsWith(ap) 均为 true",nodes=list(nodes.values()),edges=edges,variables={"operations":4},result=["app","ap"],output=final,formula="true, true",status="return"),"插入与查询共享相同前缀路径。",phase="return"))
    return _trace(item,"trie",events,example,final,algorithm="字符边前缀树",invariant="根到当前节点的路径拼接等于已读前缀",aha="共享前缀只存一次，is_end 区分单词与前缀",time="O(total chars)",space="O(total chars)",input_data=["insert apple","insert app","search app","startsWith ap"])


def build_20(item,code,example):
    line=Lines(code);s="([{}])";pairs={')':'(',']':'[','}':'{'};stack=[];events=[event(line.id("stack<char> stk"),complete_state("stack-sequence","括号栈为空",values=list(s),stack=[],variables={"i":None}),"栈顶必须匹配下一枚右括号。",phase="setup")]
    for i,ch in enumerate(s):
        if ch not in pairs:
            stack.append(ch);needle="stk.push(c)";action=f"左括号 {ch} 入栈"
        else:
            match=bool(stack and stack[-1]==pairs[ch]);events.append(event(line.id("if (stk.size()"),complete_state("stack-sequence",f"右括号 {ch} 检查栈顶",values=list(s),stack=stack.copy(),variables={"i":i,"char":ch,"match":match},active=[i],formula=f"top={stack[-1] if stack else None}, need={pairs[ch]}"),"必须与最近未闭合的左括号匹配。",phase="compare"))
            if not match:break
            stack.pop();needle="stk.pop()";action=f"匹配成功，弹出 {pairs[ch]}"
        events.append(event(line.id(needle),complete_state("stack-sequence",action,values=list(s),stack=stack.copy(),variables={"i":i,"char":ch},active=[i],formula=str(stack)),"处理后栈仍只含未闭合左括号。",phase="mutate"))
    answer=not stack
    events.append(event(line.id("return stk.empty"),complete_state("stack-sequence","栈为空，括号串有效",values=list(s),stack=stack,variables={"empty":answer},result=list(range(len(s))),output=answer,formula="empty=true",status="return"),"所有左括号都按正确嵌套顺序闭合。",phase="return"))
    return _trace(item,"stack-sequence",events,example,True,algorithm="左括号栈",invariant="栈从底到顶是尚未闭合的嵌套顺序",aha="右括号只能匹配最近的未闭合左括号",time="O(n)",space="O(n)",input_data=s)


def build_155(item,code,example):
    line=Lines(code);ops=[("push",-2),("push",0),("push",-3),("getMin",None),("pop",None),("getMin",None)];stack=[];mins=[];answers=[];events=[event(line.id("stack<int> stk, f"),complete_state("stack-sequence","数据栈与最小栈均为空",stack=[],heap=[],variables={"operation":"init"}),"最小栈只保存会成为某一时刻最小值的元素。",phase="setup")]
    for op,value in ops:
        if op=="push":
            stack.append(value)
            if not mins or mins[-1]>=value:mins.append(value)
            events.append(event([line.id("stk.push(x)"),line.id("f.empty() || f.top()")],complete_state("stack-sequence",f"push({value})",stack=stack.copy(),heap=mins.copy(),variables={"operation":op,"x":value,"min":mins[-1]},activeStack=[value],formula=f"min={mins[-1]}"),"相等最小值也入辅助栈，保证重复值正确弹出。",phase="mutate"))
        elif op=="pop":
            value=stack.pop()
            if value<=mins[-1]:mins.pop()
            events.append(event([line.id("if (stk.top() <= f.top())"),line.id("stk.pop()")],complete_state("stack-sequence",f"pop() 移除 {value}",stack=stack.copy(),heap=mins.copy(),variables={"operation":op,"min":mins[-1]},formula=f"removed={value}"),"仅当弹出值等于当前最小时同步弹最小栈。",phase="mutate"))
        else:
            answers.append(mins[-1]);events.append(event(line.id("return f.top()"),complete_state("stack-sequence",f"getMin()={mins[-1]}",stack=stack.copy(),heap=mins.copy(),variables={"operation":op,"return":mins[-1]},result=[len(mins)-1],output=answers.copy(),formula=str(mins[-1])),"辅助栈顶始终是全栈最小值。",phase="accept"))
    events.append(event(line.id("return f.top()"),complete_state("stack-sequence","最小值查询序列 [-3,-2]",stack=stack,heap=mins,variables={"queries":2},output=answers,formula=str(answers),status="return"),"所有操作均为 O(1)。",phase="return"))
    return _trace(item,"stack-sequence",events,example,answers,algorithm="同步最小值辅助栈",invariant="f.top() 等于 stk 中最小元素",aha="只记录最小值发生变化的历史层级",time="O(1) per op",space="O(n)",input_data=ops)


def build_394(item,code,example):
    line=Lines(code);s="3[a2[c]]";events=[];u=0
    def dfs(depth):
        nonlocal u
        result=""
        events.append(event(line.id("string res"),complete_state("backtracking",f"进入递归层 {depth}",values=list(s),stack=[f"depth {d}" for d in range(depth+1)],path=list(result),variables={"u":u,"depth":depth,"res":result}),"每层只解码直到自己的右括号。",phase="inspect"))
        while u<len(s) and s[u]!=']':
            if s[u].isalpha():
                ch=s[u];result+=ch;u+=1
                events.append(event(line.id("res += s[u ++ ]"),complete_state("backtracking",f"追加字符 {ch}",values=list(s),stack=[f"depth {d}" for d in range(depth+1)],path=list(result),variables={"u":u,"depth":depth,"res":result},active=[u-1],formula=result),"普通字符直接加入当前层结果。",phase="mutate"))
            else:
                start=u
                while s[u].isdigit():u+=1
                times=int(s[start:u]);u+=1
                events.append(event(line.id("int x = stoi"),complete_state("backtracking",f"读取重复次数 {times}",values=list(s),stack=[f"depth {d}" for d in range(depth+1)],path=list(result),variables={"u":u,"depth":depth,"x":times,"res":result},active=[start],formula=f"x={times}"),"跳过左括号后递归解码内部。",phase="compare"))
                inner=dfs(depth+1);u+=1;result+=inner*times
                events.append(event(line.id("while (x -- ) res += y"),complete_state("backtracking",f"把 {inner} 重复 {times} 次",values=list(s),stack=[f"depth {d}" for d in range(depth+1)],path=list(result),variables={"u":u,"depth":depth,"x":times,"y":inner,"res":result},formula=f"{inner}×{times}={inner*times}"),"子串完全解码后再整体重复。",phase="mutate"))
        return result
    answer=dfs(0)
    events.append(event(line.id("return dfs(s, u)"),complete_state("backtracking",f"返回解码串 {answer}",values=list(s),stack=[],path=list(answer),variables={"u":u},result=list(range(len(answer))),output=answer,formula=answer,status="return"),"嵌套 2[c] 先得到 cc，再由外层重复三次。",phase="return"))
    return _trace(item,"backtracking",events,example,answer,algorithm="递归下降解析嵌套编码",invariant="每层只消费到与其配对的右括号之前",aha="括号内部先递归求值，再按前导数字重复",time="O(output)",space="O(depth)",input_data=s)


def build_739(item,code,example):
    line=Lines(code);temps=[73,74,75,71,69,72,76,73];stack=[];res=[0]*8;events=[event(line.id("stack<int> stk"),complete_state("stack-sequence","从右向左建立更暖候选栈",values=temps,stack=[],variables={"i":None},output=res),"栈顶是右侧第一个更暖日的候选。",phase="setup")]
    for i in range(7,-1,-1):
        while stack and temps[i]>=temps[stack[-1]]:
            removed=stack.pop();events.append(event(line.id("stk.pop()"),complete_state("stack-sequence",f"{temps[i]} 淘汰右侧 {temps[removed]}",values=temps,stack=stack.copy(),variables={"i":i,"removed":removed},compared=[i,removed],formula=f"{temps[i]} >= {temps[removed]}"),"不更暖且更远的日子永不可能成为答案。",phase="mutate"))
        if stack:res[i]=stack[-1]-i
        events.append(event(line.id("if (stk.size()) res[i]"),complete_state("stack-sequence",f"res[{i}]={res[i]}",values=temps,stack=stack.copy(),variables={"i":i,"next":stack[-1] if stack else None},active=[i],result=[stack[-1]] if stack else [],output=res.copy(),formula=f"distance={res[i]}"),"清理后栈顶就是最近更暖日。",phase="accept"))
        stack.append(i)
        events.append(event(line.id("stk.push(i)"),complete_state("stack-sequence",f"下标 {i} 入栈",values=temps,stack=stack.copy(),variables={"i":i},active=[i],formula=str(stack)),"栈从底到顶温度递减。",phase="mutate"))
    events.append(event(line.id("return res"),complete_state("stack-sequence","返回等待天数",values=temps,stack=stack,result=list(range(8)),output=res,formula=str(res),status="return"),"每天下一个更暖日已经确定。",phase="return"))
    return _trace(item,"stack-sequence",events,example,res,algorithm="从右向左单调栈",invariant="栈中下标对应温度从底到顶严格递减",aha="弹掉不更暖候选后栈顶即最近更暖日",time="O(n)",space="O(n)",input_data=temps)


def build_84(item,code,example):
    line=Lines(code);h=[2,1,5,6,2,3];n=6;left=[None]*n;right=[None]*n;stack=[];events=[event(line.id("vector<int> left"),complete_state("stack-sequence","准备寻找每根柱左侧首个更矮位置",values=h,stack=[],variables={"phase":"left"},output=[]),"矩形以柱高为短板时边界由两侧首个更矮柱决定。",phase="setup")]
    for i in range(n):
        while stack and h[stack[-1]]>=h[i]:stack.pop()
        left[i]=stack[-1] if stack else -1;stack.append(i)
        events.append(event([line.id("while (stk.size()",occurrence=1),line.id("stk.push(i)",occurrence=1)],complete_state("stack-sequence",f"left[{i}]={left[i]}",values=h,stack=stack.copy(),variables={"i":i,"phase":"left"},active=[i],result=[left[i]] if left[i]>=0 else [],output=left.copy(),formula=f"left={left[i]}"),"栈顶是左侧最近严格更矮柱。",phase="mutate"))
    stack=[]
    for i in range(n-1,-1,-1):
        while stack and h[stack[-1]]>=h[i]:stack.pop()
        right[i]=stack[-1] if stack else n;stack.append(i)
        events.append(event([line.id("while (stk.size()",occurrence=2),line.id("stk.push(i)",occurrence=2)],complete_state("stack-sequence",f"right[{i}]={right[i]}",values=h,stack=stack.copy(),variables={"i":i,"phase":"right"},active=[i],result=[right[i]] if right[i]<n else [],output=right.copy(),formula=f"right={right[i]}"),"对称地得到右侧最近严格更矮柱。",phase="mutate"))
    best=0;best_i=0
    for i in range(n):
        area=h[i]*(right[i]-left[i]-1)
        if area>best:best=area;best_i=i
        events.append(event(line.id("res = max"),complete_state("stack-sequence",f"以高度 {h[i]} 计算面积 {area}",values=h,stack=[],variables={"i":i,"left":left[i],"right":right[i],"res":best},active=[i],result=list(range(left[i]+1,right[i])),formula=f"{h[i]}×({right[i]}-{left[i]}-1)={area}"),"首个更矮边界之间都不低于当前柱高。",phase="compare"))
    events.append(event(line.id("return res"),complete_state("stack-sequence","返回最大矩形面积 10",values=h,stack=[],variables={"i":best_i,"res":best},result=[2,3],output=best,formula="5×2=10",status="return"),"下标 2、3 两柱形成最优矩形。",phase="return"))
    return _trace(item,"stack-sequence",events,example,10,algorithm="两遍单调栈求更矮边界",invariant="栈内柱高严格递增",aha="固定短板高度后最大宽度由两侧首个更矮柱唯一决定",time="O(n)",space="O(n)",input_data=h)


def build_215(item,code,example):
    line=Lines(code);original=[3,2,1,5,6,4];a=original.copy();target=1;events=[event(line.id("return quick_sort"),complete_state("array-pointers","第 2 大对应降序下标 1",values=a,variables={"l":0,"r":5,"k":target}),"快速选择只递归包含 k 的分区。",phase="setup")]
    l,r=0,5
    while l<r:
        pivot=a[l];i=l-1;j=r+1
        while True:
            i+=1
            while a[i]>pivot:i+=1
            j-=1
            while a[j]<pivot:j-=1
            events.append(event(line.id("if (i < j) swap"),complete_state("array-pointers",f"分区指针 i={i}, j={j}",values=a,variables={"l":l,"r":r,"k":target,"x":pivot,"i":i,"j":j},pointers={"i":i,"j":j},compared=[i,j],formula=f"pivot={pivot}"),"i 停在不大于基准处，j 停在不小于基准处。",phase="compare"))
            if i>=j:break
            a[i],a[j]=a[j],a[i]
            events.append(event(line.id("swap(nums[i], nums[j])"),complete_state("array-pointers",f"交换 {i} 与 {j}",values=a,variables={"l":l,"r":r,"k":target,"x":pivot},active=[i,j],formula="partition swap"),"交换恢复左大右小分区。",phase="mutate"))
        if target<=j:r=j;needle="if (k <= j)"
        else:l=j+1;needle="else return quick_sort"
        events.append(event(line.id(needle),complete_state("array-pointers",f"k 位于新区间 [{l},{r}]",values=a,variables={"l":l,"r":r,"k":target,"j":j},result=list(range(l,r+1)),formula=f"k={target}"),"另一侧分区无需排序。",phase="inspect"))
    answer=a[target]
    events.append(event(line.id("if (l == r) return nums[k]"),complete_state("array-pointers","返回第 2 大元素 5",values=a,variables={"l":l,"r":r,"k":target},result=[target],output=answer,formula="nums[1]=5",status="return"),"候选区间收缩为单点。",phase="return"))
    return _trace(item,"array-pointers",events,example,5,algorithm="降序快速选择",invariant="目标下标 k 始终位于当前闭区间",aha="分区后只递归包含 k 的一侧",time="O(n) average",space="O(log n)",input_data={"nums":original,"k":2})


def build_347(item,code,example):
    line=Lines(code);nums=[1,1,1,2,2,3];k=2;cnt=Counter(nums);bucket=[0]*(len(nums)+1);events=[event(line.id("for (auto x: nums) cnt[x]"),complete_state("hash-array","统计元素频次",values=nums,hash={str(x):c for x,c in cnt.items()},variables={"k":k},formula=str(dict(cnt))),"后续只关心频次阈值。",phase="setup")]
    for x,c in cnt.items():bucket[c]+=1;events.append(event(line.id("s[c] ++"),complete_state("hash-array",f"频次 {c} 有 {bucket[c]} 个元素",values=bucket,hash={str(v):freq for v,freq in cnt.items()},variables={"x":x,"c":c},active=[c],formula=f"s[{c}]={bucket[c]}"),"桶 s[c] 统计有多少种元素频次为 c。",phase="mutate"))
    i=len(nums);total=0
    while total<k:
        total+=bucket[i];i-=1
        events.append(event(line.id("while (t < k)"),complete_state("hash-array",f"从高频向下累计到 {total}",values=bucket,hash={str(v):freq for v,freq in cnt.items()},variables={"i":i,"t":total,"k":k},active=[i+1],formula=f"t += s[{i+1}]"),"停止后的 i 是严格高于它的频次阈值。",phase="compare"))
    out=[x for x,c in cnt.items() if c>i]
    events.append(event(line.id("res.push_back(x)"),complete_state("hash-array","收集频次高于阈值的元素",values=nums,hash={str(v):freq for v,freq in cnt.items()},variables={"threshold":i,"k":k},result=[idx for idx,v in enumerate(nums) if v in out],output=out,formula=str(out)),"题目保证答案数量恰好为 k。",phase="accept"))
    events.append(event(line.id("return res"),complete_state("hash-array","返回高频元素 [1,2]",values=nums,hash={str(v):freq for v,freq in cnt.items()},variables={"threshold":i},result=[0,1,2,3,4],output=out,formula=str(out),status="return"),"1 与 2 的频次最高。",phase="return"))
    return _trace(item,"hash-array",events,example,out,algorithm="频次哈希 + 频次桶阈值",invariant="t 是已扫过高频桶包含的元素种类数",aha="不需排序元素，只需找到第 k 高频次边界",time="O(n)",space="O(n)",input_data={"nums":nums,"k":k})


def build_295(item,code,example):
    line=Lines(code);down=[];up=[];medians=[];events=[event(line.id("priority_queue<int> down"),complete_state("heap","两个堆均为空",heap=[],queue=[],variables={"operation":"init"}),"down 保存较小一半的大根堆，up 保存较大一半的小根堆。",phase="setup")]
    for num in [1,2,3]:
        if not down or num<=-down[0]:heappush(down,-num);needle="down.push(num)"
        else:heappush(up,num);needle="up.push(num)"
        events.append(event(line.id(needle),complete_state("heap",f"插入 {num}",heap=sorted([-x for x in down],reverse=True),queue=sorted(up),variables={"num":num,"downTop":-down[0],"upTop":up[0] if up else None},activeHeap=[num],formula=f"sizes={len(down)}/{len(up)}"),"先按数值归入对应半区。",phase="mutate"))
        if len(down)>len(up)+1:heappush(up,-heappop(down));balance="down→up"
        elif len(up)>len(down):heappush(down,-heappop(up));balance="up→down"
        else:balance="balanced"
        events.append(event(line.id("if (down.size() > up.size() + 1)","if (up.size() > down.size())"),complete_state("heap",f"平衡堆：{balance}",heap=sorted([-x for x in down],reverse=True),queue=sorted(up),variables={"num":num,"downSize":len(down),"upSize":len(up)},formula=balance),"down 只能与 up 等大或多一个。",phase="inspect"))
        median=float(-down[0]) if (len(down)+len(up))%2 else (-down[0]+up[0])/2
        medians.append(median)
        events.append(event(line.id("return down.top()","return (down.top() + up.top())"),complete_state("heap",f"当前中位数 {median:g}",heap=sorted([-x for x in down],reverse=True),queue=sorted(up),variables={"median":median},result=[0],output=medians.copy(),formula=f"median={median:g}"),"堆顶直接给出中间一个或两个数。",phase="accept"))
    events.append(event(line.id("return down.top()"),complete_state("heap","中位数序列 [1,1.5,2]",heap=sorted([-x for x in down],reverse=True),queue=sorted(up),variables={"count":3},output=medians,formula=str(medians),status="return"),"每次插入后两堆仍满足顺序与大小不变量。",phase="return"))
    return _trace(item,"heap",events,example,medians,algorithm="大小堆维护两半数据",invariant="down 所有值不大于 up，且 down 大小等于 up 或多一",aha="中位数只依赖两个堆顶",time="O(log n) add / O(1) query",space="O(n)",input_data=[1,2,3])


BUILDERS:dict[int,Callable[[dict,str,tuple[str,str]],dict]]={20:build_20,48:build_48,54:build_54,73:build_73,84:build_84,155:build_155,200:build_200,207:build_207,208:build_208,215:build_215,240:build_240,295:build_295,347:build_347,394:build_394,739:build_739,994:build_994}
