"""Deterministic traces for array, hash, window, binary, and greedy problems."""

from __future__ import annotations

from collections import Counter, defaultdict, deque
from copy import deepcopy
from typing import Any, Callable

from series_core import Lines, complete_state, event, make_trace


def _trace(item: dict, scene: str, events: list[dict], example: tuple[str, str], expected: Any, *, algorithm: str, invariant: str, aha: str, time: str = "O(n)", space: str = "O(n)", input_data: Any = None) -> dict:
    return make_trace(item, scene, events, algorithm=algorithm, invariant=invariant, aha=aha, time=time, space=space, example_text=example[0], expected_text=example[1], input_data=input_data if input_data is not None else example[0], expected=expected)


def build_49(item: dict, code: str, example: tuple[str, str]) -> dict:
    line, words = Lines(code), ["eat", "tea", "tan", "ate", "nat", "bat"]
    groups: dict[str, list[str]] = defaultdict(list)
    events = [event(line.id("unordered_map<string"), complete_state("hash-array", "建立分组哈希表", values=words, hash={}, variables={"i": None, "key": None}), "哈希表为空，尚未处理单词。", phase="setup")]
    for i, word in enumerate(words):
        key = "".join(sorted(word))
        events.append(event(line.id("sort(nstr.begin"), complete_state("hash-array", f"排序 {word} 得到键 {key}", values=words, hash={k: ", ".join(v) for k, v in groups.items()}, variables={"i": i, "key": key}, active=[i], formula=f"sort({word}) = {key}"), "排序后的字符串唯一代表字符多重集。", phase="compare"))
        groups[key].append(word)
        events.append(event(line.id("hash[nstr].push_back"), complete_state("hash-array", f"把 {word} 放入 {key} 组", values=words, hash={k: ", ".join(v) for k, v in groups.items()}, variables={"i": i, "key": key}, active=[i], formula=f"hash[{key}] += {word}"), "只更新当前键对应的分组，其他组保持不变。", phase="mutate"))
    output = list(groups.values())
    events.append(event(line.id("return res"), complete_state("hash-array", "返回 3 组字母异位词", values=words, hash={k: ", ".join(v) for k, v in groups.items()}, variables={"groups": 3}, result=list(range(len(words))), output=output, formula="return 3 groups", status="return"), "所有单词恰好进入一个规范键分组。", phase="return"))
    return _trace(item, "hash-array", events, example, output, algorithm="排序键 + 哈希分组", invariant="相同排序键中的单词字符多重集完全相同", aha="把异位关系变成可哈希的规范字符串", time="O(nk log k)", space="O(nk)", input_data=words)


def build_128(item: dict, code: str, example: tuple[str, str]) -> dict:
    line, nums = Lines(code), [100, 4, 200, 1, 3, 2]
    remaining = set(nums)
    events = [event(line.id("unordered_set<int>"), complete_state("hash-array", "把所有数字放入集合", values=nums, hash={str(x): "未访问" for x in sorted(remaining)}, variables={"x": None, "y": None, "res": 0}), "集合支持 O(1) 判断前驱和后继。", phase="setup")]
    best = 0
    for i, x in enumerate(nums):
        if x not in remaining:
            events.append(event(line.id("if (S.count(x)"), complete_state("hash-array", f"{x} 已被所属序列处理，跳过", values=nums, hash={str(v): "未访问" for v in sorted(remaining)}, variables={"i": i, "x": x, "y": None, "res": best}, active=[i], formula=f"S.count({x}) = 0"), "每个元素只会被一个序列起点消费。", phase="inspect"))
            continue
        if x - 1 in remaining:
            events.append(event(line.id("if (S.count(x)"), complete_state("hash-array", f"{x} 有前驱 {x-1}，不是起点", values=nums, hash={str(v): "未访问" for v in sorted(remaining)}, variables={"i": i, "x": x, "y": None, "res": best}, active=[i], formula=f"S.count({x-1}) = 1"), "只有没有前驱的数字才向后延伸。", phase="compare"))
            continue
        y = x
        remaining.remove(x)
        events.append(event(line.id("S.erase(x)"), complete_state("hash-array", f"从起点 {x} 开始延伸", values=nums, hash={str(v): "未访问" for v in sorted(remaining)}, variables={"i": i, "x": x, "y": y, "res": best}, active=[i]), "起点从集合移除，防止重复访问。", phase="mutate"))
        while y + 1 in remaining:
            y += 1
            remaining.remove(y)
            events.append(event(line.id("S.erase(y)"), complete_state("hash-array", f"连续序列延伸到 {y}", values=nums, hash={str(v): "未访问" for v in sorted(remaining)}, variables={"i": i, "x": x, "y": y, "res": best}, active=[nums.index(y)], formula=f"length = {y}-{x}+1 = {y-x+1}"), "后继存在时继续延伸，并立即标记已访问。", phase="mutate"))
        best = max(best, y - x + 1)
        events.append(event(line.id("res = max"), complete_state("hash-array", f"最长长度更新为 {best}", values=nums, hash={str(v): "未访问" for v in sorted(remaining)}, variables={"x": x, "y": y, "res": best}, result=[nums.index(v) for v in range(x, y + 1) if v in nums], formula=f"res=max(res,{y-x+1})={best}"), "当前连续段已完整计数。", phase="accept"))
    events.append(event(line.id("return res"), complete_state("hash-array", "返回最长连续长度 4", values=nums, hash={}, variables={"res": best}, result=[1, 3, 4, 5], output=best, formula="return 4", status="return"), "最长连续序列是 1,2,3,4。", phase="return"))
    return _trace(item, "hash-array", events, example, 4, algorithm="哈希集合只从序列起点延伸", invariant="集合中的每个数字最多被删除一次", aha="前驱不存在时才启动一次完整延伸", input_data=nums)


def build_283(item: dict, code: str, example: tuple[str, str]) -> dict:
    line, original = Lines(code), [0, 1, 0, 3, 12]
    nums, k, events = original.copy(), 0, []
    events.append(event(line.id("int k = 0"), complete_state("array-pointers", "k 指向下一个非零写入位置", values=nums, variables={"scan": None, "k": k}, pointers={"k": k}), "初始化写指针。", phase="setup"))
    for scan, x in enumerate(original):
        events.append(event(line.id("if (x)"), complete_state("array-pointers", f"检查 nums[{scan}]={x}", values=nums, variables={"scan": scan, "k": k, "x": x}, pointers={"scan": scan, "k": k}, active=[scan], formula=f"{x} != 0 → {bool(x)}"), "扫描指针只决定当前值是否写入。", phase="compare"))
        if x:
            nums[k] = x
            events.append(event(line.id("nums[k ++ ] = x"), complete_state("array-pointers", f"把 {x} 写到位置 {k}", values=nums, variables={"scan": scan, "k": k + 1, "x": x}, pointers={"scan": scan, "k": k + 1}, active=[k], result=list(range(k + 1)), formula=f"nums[{k}]={x}; k={k+1}"), "非零元素按原顺序写入前缀。", phase="mutate"))
            k += 1
    while k < len(nums):
        nums[k] = 0
        events.append(event(line.id("while (k < nums.size())"), complete_state("array-pointers", f"尾部位置 {k} 补 0", values=nums, variables={"k": k + 1}, pointers={"k": k}, active=[k], result=list(range(k + 1)), formula=f"nums[{k}]=0"), "非零前缀之后全部补零。", phase="mutate"))
        k += 1
    events.append(event(line.id("while (k < nums.size())"), complete_state("array-pointers", "原地移动完成", values=nums, variables={"k": k}, pointers={}, result=list(range(len(nums))), output=nums, formula="[1,3,12,0,0]", status="return"), "非零相对顺序保持，零全部位于末尾。", phase="return"))
    return _trace(item, "array-pointers", events, example, nums, algorithm="读写指针稳定压缩", invariant="nums[0:k) 始终是已扫描元素中的全部非零值", aha="先覆盖写入非零前缀，再统一补零", time="O(n)", space="O(1)", input_data=original)


def build_11(item: dict, code: str, example: tuple[str, str]) -> dict:
    line, height = Lines(code), [1, 8, 6, 2, 5, 4, 8, 3, 7]
    i, j, best, events = 0, len(height) - 1, 0, []
    events.append(event(line.id("int res = 0"), complete_state("array-pointers", "双指针夹住全部柱子", values=height, variables={"i": i, "j": j, "res": best}, pointers={"i": i, "j": j}, compared=[i, j]), "最大候选区间从两端开始。", phase="setup"))
    while i < j:
        area = min(height[i], height[j]) * (j - i)
        best = max(best, area)
        events.append(event(line.id("res = max"), complete_state("array-pointers", f"计算 [{i},{j}] 面积 {area}", values=height, variables={"i": i, "j": j, "res": best}, pointers={"i": i, "j": j}, compared=[i, j], result=[i, j] if area == best else [], formula=f"min({height[i]},{height[j]})×{j-i}={area}"), "宽度乘较矮柱得到当前面积。", phase="compare"))
        if height[i] > height[j]:
            old = j; j -= 1; needle = "j --"
        else:
            old = i; i += 1; needle = "i ++"
        events.append(event(line.id(needle), complete_state("array-pointers", f"排除较矮端点 {old}", values=height, variables={"i": i, "j": j, "res": best}, pointers={"i": i, "j": j}, active=[i, j], formula=f"next range=[{i},{j}]"), "宽度必减，只移动较矮端才可能提高高度上限。", phase="mutate"))
    events.append(event(line.id("return res"), complete_state("array-pointers", "返回最大面积 49", values=height, variables={"i": i, "j": j, "res": best}, pointers={}, result=[1, 8], output=best, formula="7×7=49", status="return"), "最优容器由下标 1 和 8 构成。", phase="return"))
    return _trace(item, "array-pointers", events, example, 49, algorithm="两端对撞并排除较矮柱", invariant="被排除端点不可能参与更大面积", aha="宽度缩小时只有提高短板才可能改进答案", time="O(n)", space="O(1)", input_data=height)


def build_15(item: dict, code: str, example: tuple[str, str]) -> dict:
    line, original = Lines(code), [-1, 0, 1, 2, -1, -4]
    nums, found, events = sorted(original), [], []
    events.append(event(line.id("sort(nums.begin"), complete_state("array-pointers", "排序后开始固定第一个数", values=nums, variables={"i": None, "j": None, "k": None}, result=[]), "排序让双指针移动方向和去重都可判定。", phase="setup"))
    for i in range(len(nums)):
        if i and nums[i] == nums[i - 1]:
            events.append(event(line.id("if (i &&"), complete_state("array-pointers", f"固定值 {nums[i]} 重复，跳过", values=nums, variables={"i": i, "j": None, "k": None}, pointers={"i": i}, active=[i]), "相同固定值只处理一次。", phase="inspect"))
            continue
        k = len(nums) - 1
        for j in range(i + 1, len(nums)):
            if j >= k: break
            if j > i + 1 and nums[j] == nums[j - 1]:
                events.append(event(line.id("if (j > i + 1"), complete_state("array-pointers", f"第二个值 {nums[j]} 重复，跳过", values=nums, variables={"i": i, "j": j, "k": k}, pointers={"i": i, "j": j, "k": k}, active=[j]), "第二层也保持唯一。", phase="inspect"))
                continue
            while j < k - 1 and nums[i] + nums[j] + nums[k - 1] >= 0:
                k -= 1
                events.append(event(line.id("while (j < k - 1"), complete_state("array-pointers", f"三数和偏大，k 左移到 {k}", values=nums, variables={"i": i, "j": j, "k": k}, pointers={"i": i, "j": j, "k": k}, compared=[i, j, k], formula=f"{nums[i]}+{nums[j]}+{nums[k]}={nums[i]+nums[j]+nums[k]}"), "排序后 k 左移只会让和减小。", phase="mutate"))
            total = nums[i] + nums[j] + nums[k]
            events.append(event(line.id("if (nums[i] + nums[j]"), complete_state("array-pointers", f"检查和 {total}", values=nums, variables={"i": i, "j": j, "k": k}, pointers={"i": i, "j": j, "k": k}, compared=[i, j, k], formula=f"{nums[i]}+{nums[j]}+{nums[k]}={total}"), "当前位置是固定 i,j 下最靠右且和不小于零的 k。", phase="compare"))
            if total == 0:
                triple = [nums[i], nums[j], nums[k]]
                found.append(triple)
                events.append(event(line.id("res.push_back"), complete_state("array-pointers", f"记录三元组 {triple}", values=nums, variables={"i": i, "j": j, "k": k, "count": len(found)}, pointers={"i": i, "j": j, "k": k}, result=[i, j, k], output=deepcopy(found), formula="sum = 0"), "排序与两层去重保证结果不重复。", phase="accept"))
    events.append(event(line.id("return res"), complete_state("array-pointers", "返回两个唯一三元组", values=nums, variables={"count": len(found)}, result=list(range(len(nums))), output=found, formula="[-1,-1,2], [-1,0,1]", status="return"), "全部零和三元组已确认。", phase="return"))
    return _trace(item, "array-pointers", events, example, found, algorithm="排序 + 固定一数 + 对撞指针", invariant="每个 (i,j) 只保留最右侧可行 k，重复值被跳过", aha="有序性把两数搜索从平方降为线性", time="O(n²)", space="O(log n)", input_data=original)


def _window_state(values: list[Any], action: str, *, variables: dict, window: dict | None = None, need: dict | None = None, range_: list[int] | None = None, best: list[int] | None = None, active: list[int] | None = None, result: list[int] | None = None, formula: str = "", output: Any = None, status: str = "running") -> dict:
    state = complete_state("sliding-window", action, values=values, variables=variables, window=window or {}, need=need or {}, range=range_ or [], bestRange=best or [], active=active or [], result=result or [], formula=formula, status=status)
    if output is not None: state["output"] = output
    return state


def build_3(item: dict, code: str, example: tuple[str, str]) -> dict:
    line, text = Lines(code), "abcabcbb"
    values, counts, left, best_len, best_range, events = list(text), Counter(), 0, 0, [], []
    events.append(event(line.id("unordered_map<char"), _window_state(values, "建立空窗口计数", variables={"i": None, "j": left, "res": 0}), "窗口内尚无字符。", phase="setup"))
    for right, ch in enumerate(text):
        counts[ch] += 1
        events.append(event(line.id("heap[s[i]] ++"), _window_state(values, f"右端加入 {ch}", variables={"i": right, "j": left, "res": best_len}, window=dict(counts), range_=[left, right], best=best_range, active=[right], formula=f"count({ch})={counts[ch]}"), "右指针先扩展窗口。", phase="mutate"))
        while counts[ch] > 1:
            leaving = text[left]; counts[leaving] -= 1; left += 1
            events.append(event(line.id("while (heap[s[i]] > 1)"), _window_state(values, f"重复 {ch}，左端移出 {leaving}", variables={"i": right, "j": left, "res": best_len}, window={k:v for k,v in counts.items() if v}, range_=[left, right], best=best_range, active=[left, right], formula=f"count({ch})={counts[ch]}"), "收缩直到窗口重新无重复。", phase="mutate"))
        if right - left + 1 > best_len:
            best_len, best_range = right - left + 1, [left, right]
        events.append(event(line.id("res = max"), _window_state(values, f"最长长度更新/保持为 {best_len}", variables={"i": right, "j": left, "res": best_len}, window={k:v for k,v in counts.items() if v}, range_=[left, right], best=best_range, result=list(range(best_range[0], best_range[1]+1)), formula=f"res=max(res,{right-left+1})={best_len}"), "窗口合法后才更新答案。", phase="accept"))
    events.append(event(line.id("return res"), _window_state(values, "返回最长长度 3", variables={"res": best_len}, window=dict(counts), range_=[left, len(text)-1], best=best_range, result=list(range(best_range[0], best_range[1]+1)), formula="return 3", output=best_len, status="return"), "任意更长窗口都会包含重复字符。", phase="return"))
    return _trace(item, "sliding-window", events, example, 3, algorithm="无重复滑动窗口", invariant="当前窗口内每个字符计数不超过 1", aha="重复时移动左端直到恢复合法", time="O(n)", space="O(|Σ|)", input_data=text)


def build_438(item: dict, code: str, example: tuple[str, str]) -> dict:
    line, s, p = Lines(code), "cbaebabacd", "abc"
    need, cnt, left, satisfy, total, answer, events = Counter(p), Counter(p), 0, 0, len(set(p)), [], []
    events.append(event(line.id("for (auto c: p)"), _window_state(list(s), "统计 p 的需求", variables={"i": None, "j": left, "satisfy": 0, "tot": total}, need=dict(need), window={}, range_=[], formula=str(dict(need))), "每个字符的剩余需求从 p 的计数开始。", phase="setup"))
    for right, ch in enumerate(s):
        cnt[ch] -= 1
        if cnt[ch] == 0: satisfy += 1
        events.append(event(line.id("-- cnt[s[i]]"), _window_state(list(s), f"加入 {ch}，满足种类数 {satisfy}", variables={"i": right, "j": left, "satisfy": satisfy, "tot": total}, need=dict(need), window={k: need[k]-cnt[k] for k in need}, range_=[left,right], best=answer[-1:] and [answer[-1],answer[-1]+len(p)-1] or [], active=[right], formula=f"satisfy={satisfy}"), "减少剩余需求，恰好归零时新增一种满足字符。", phase="mutate"))
        while right - left + 1 > len(p):
            leaving=s[left]
            if cnt[leaving] == 0: satisfy -= 1
            cnt[leaving]+=1; left+=1
            events.append(event(line.id("cnt[s[j ++ ]] ++"), _window_state(list(s), f"固定长度窗口移出 {leaving}", variables={"i": right, "j": left, "satisfy": satisfy, "tot": total}, need=dict(need), window={k: need[k]-cnt[k] for k in need}, range_=[left,right], best=answer[-1:] and [answer[-1],answer[-1]+len(p)-1] or [], formula=f"window length={right-left+1}"), "窗口长度始终不超过 p 的长度。", phase="mutate"))
        if satisfy == total:
            answer.append(left)
            events.append(event(line.id("res.push_back(j)"), _window_state(list(s), f"记录异位词起点 {left}", variables={"i": right, "j": left, "satisfy": satisfy, "tot": total}, need=dict(need), window={k: need[k]-cnt[k] for k in need}, range_=[left,right], best=[left,right], result=list(range(left,right+1)), formula=f"satisfy=={total}", output=answer.copy()), "定长窗口满足全部字符计数，必为异位词。", phase="accept"))
    events.append(event(line.id("return res"), _window_state(list(s), "返回起点 [0,6]", variables={"satisfy": satisfy}, need=dict(need), window={}, range_=[], best=[6,8], result=[0,1,2,6,7,8], formula="return [0,6]", output=answer, status="return"), "两个合法窗口分别是 cba 和 bac。", phase="return"))
    return _trace(item, "sliding-window", events, example, [0,6], algorithm="固定长度计数窗口", invariant="窗口长度不超过 |p|，cnt 保存剩余需求", aha="satisfy 等于需求种类数时窗口就是异位词", time="O(n)", space="O(|Σ|)", input_data={"s":s,"p":p})


def build_560(item: dict, code: str, example: tuple[str, str]) -> dict:
    line, nums, k = Lines(code), [1,1,1], 2
    prefix=[0]
    for x in nums: prefix.append(prefix[-1]+x)
    counts={0:1}; result=0; events=[]
    events.append(event(line.id("hash[0] = 1"), complete_state("hash-array", "初始化空前缀出现一次", values=prefix, hash={"0":1}, variables={"i":0,"k":k,"res":0}, active=[0], formula="hash[0]=1"), "它负责匹配从下标 0 开始的子数组。", phase="setup"))
    for i in range(1,len(prefix)):
        target=prefix[i]-k; add=counts.get(target,0); result+=add
        events.append(event(line.id("res += hash"), complete_state("hash-array", f"查询前缀和 {target}，新增 {add} 个", values=prefix, hash={str(a):b for a,b in counts.items()}, variables={"i":i,"s[i]":prefix[i],"target":target,"res":result}, active=[i], formula=f"res += hash[{prefix[i]}-{k}] = {add}"), "每个匹配前缀唯一对应一个和为 k 的子数组。", phase="compare"))
        counts[prefix[i]]=counts.get(prefix[i],0)+1
        events.append(event(line.id("hash[s[i]] ++"), complete_state("hash-array", f"记录前缀和 {prefix[i]}", values=prefix, hash={str(a):b for a,b in counts.items()}, variables={"i":i,"s[i]":prefix[i],"res":result}, active=[i], formula=f"hash[{prefix[i]}]={counts[prefix[i]]}"), "当前前缀供后续位置查询。", phase="mutate"))
    events.append(event(line.id("return res"), complete_state("hash-array", "返回子数组个数 2", values=prefix, hash={str(a):b for a,b in counts.items()}, variables={"res":result}, result=[1,2,3], output=result, formula="return 2", status="return"), "两个长度为 2 的子数组满足条件。", phase="return"))
    return _trace(item,"hash-array",events,example,2,algorithm="前缀和计数哈希",invariant="hash 只统计当前位置之前的前缀和",aha="区间和 k 等价于寻找 prefix-k",input_data={"nums":nums,"k":k})


def build_239(item: dict, code: str, example: tuple[str, str]) -> dict:
    line, nums, k = Lines(code), [1,3,-1,-3,5,3,6,7], 3
    q: deque[int]=deque(); output=[]; events=[]
    events.append(event(line.id("deque<int> q"), complete_state("stack-sequence", "建立单调递减队列", values=nums, queue=[], variables={"i":None,"k":k}, output=[]), "队列保存下标，队首始终是当前窗口最大值。", phase="setup"))
    for i,x in enumerate(nums):
        if q and i-k+1>q[0]:
            expired=q.popleft(); events.append(event(line.id("q.pop_front"), complete_state("stack-sequence", f"移除过期下标 {expired}", values=nums, queue=list(q), variables={"i":i,"left":i-k+1}, active=[i], formula=f"{expired} < {i-k+1}"), "队列中只保留当前窗口下标。", phase="mutate"))
        while q and x>=nums[q[-1]]:
            removed=q.pop(); events.append(event(line.id("q.pop_back"), complete_state("stack-sequence", f"{x} 淘汰队尾 {nums[removed]}", values=nums, queue=list(q), variables={"i":i,"removed":removed}, compared=[removed,i], formula=f"{x} >= {nums[removed]}"), "更早且更小的元素不再可能成为最大值。", phase="mutate"))
        q.append(i)
        events.append(event(line.id("q.push_back(i)"), complete_state("stack-sequence", f"下标 {i} 入队", values=nums, queue=list(q), variables={"i":i,"front":q[0]}, active=[i], activeQueue=[i]), "入队后数值仍单调递减。", phase="mutate"))
        if i>=k-1:
            output.append(nums[q[0]])
            events.append(event(line.id("res.push_back"), complete_state("stack-sequence", f"窗口 [{i-k+1},{i}] 最大值 {nums[q[0]]}", values=nums, queue=list(q), variables={"i":i,"left":i-k+1,"front":q[0]}, result=[q[0]], output=output.copy(), formula=f"max={nums[q[0]]}"), "队首就是当前窗口最大值。", phase="accept"))
    events.append(event(line.id("return res"), complete_state("stack-sequence", "返回 6 个窗口最大值", values=nums, queue=list(q), variables={"count":len(output)}, result=list(range(len(nums))), output=output, formula=str(output), status="return"), "所有窗口按顺序得到最大值。", phase="return"))
    return _trace(item,"stack-sequence",events,example,output,algorithm="下标单调队列",invariant="队列下标在窗口内且对应值严格递减",aha="新元素会永久淘汰更早且不更大的候选",input_data={"nums":nums,"k":k})


def build_53(item: dict, code: str, example: tuple[str, str]) -> dict:
    line, nums = Lines(code), [-2,1,-3,4,-1,2,1,-5,4]
    f=[None]*len(nums); last=0; best=-(1<<60); events=[]
    events.append(event(line.id("int res = INT_MIN"), complete_state("dp-table","初始化全局答案为负无穷",values=f,variables={"i":None,"last":0,"res":"-∞"}),"全负数组也必须保留最大单个元素。",phase="setup"))
    for i,x in enumerate(nums):
        previous=last; last=x+max(last,0); f[i]=last
        events.append(event(line.id("last = nums[i]"),complete_state("dp-table",f"以 {x} 结尾的最大和为 {last}",values=f,variables={"i":i,"x":x,"last":last,"res":best if best>-(1<<50) else "-∞"},active=[i],compared=[i-1] if i else [],formula=f"f[{i}]={x}+max({previous},0)={last}"),"负前缀只会拖累当前子数组，因此可以从当前元素重启。",phase="mutate"))
        best=max(best,last)
        events.append(event(line.id("res = max"),complete_state("dp-table",f"全局最大和更新/保持为 {best}",values=f,variables={"i":i,"last":last,"res":best},active=[i],result=[i] if last==best else [],formula=f"res=max(res,{last})={best}"),"局部最优与全局最优在不同变量中维护。",phase="accept"))
    events.append(event(line.id("return res"),complete_state("dp-table","返回最大子数组和 6",values=f,variables={"res":best},result=[3,4,5,6],output=best,formula="4-1+2+1=6",status="return"),"最优区间是 [4,-1,2,1]。",phase="return"))
    return _trace(item,"dp-table",events,example,6,algorithm="Kadane 一维动态规划",invariant="last 是必须以 i 结尾的最大和",aha="负的历史贡献应当直接丢弃",time="O(n)",space="O(1)",input_data=nums)


def build_56(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); intervals=[[1,3],[2,6],[8,10],[15,18]]; values=[f"[{a},{b}]" for a,b in intervals]
    result=[]; l,r=intervals[0]; events=[event(line.id("sort(a.begin"),complete_state("interval","按左端点排序区间",values=values,variables={"i":0,"l":l,"r":r},active=[0],output=[]),"排序后只需比较下一个左端点与当前右端点。",phase="setup")]
    for i in range(1,len(intervals)):
        a,b=intervals[i]
        events.append(event(line.id("if (a[i][0] > r)"),complete_state("interval",f"比较区间 [{a},{b}] 与当前 [{l},{r}]",values=values,variables={"i":i,"l":l,"r":r},compared=[i],output=deepcopy(result),formula=f"{a} > {r} → {a>r}"),"左端点超过 r 才表示出现断点。",phase="compare"))
        if a>r:
            result.append([l,r])
            events.append(event(line.id("res.push_back({l, r})"),complete_state("interval",f"确认区间 [{l},{r}]",values=values,variables={"i":i,"l":l,"r":r},result=list(range(i)),output=deepcopy(result),formula=f"emit [{l},{r}]"),"已经不可能再有后续区间与它重叠。",phase="accept"))
            l,r=a,b
            events.append(event(line.id("l = a[i][0]"),complete_state("interval",f"开启新区间 [{l},{r}]",values=values,variables={"i":i,"l":l,"r":r},active=[i],output=deepcopy(result)),"当前区间重新从断点开始。",phase="mutate"))
        else:
            old=r; r=max(r,b)
            events.append(event(line.id("else r = max"),complete_state("interval",f"合并后右端点扩为 {r}",values=values,variables={"i":i,"l":l,"r":r},active=[i],output=deepcopy(result),formula=f"r=max({old},{b})={r}"),"重叠区间只需扩展右边界。",phase="mutate"))
    result.append([l,r])
    events.append(event(line.id("res.push_back({l, r})",occurrence=2),complete_state("interval",f"循环结束，确认 [{l},{r}]",values=values,variables={"l":l,"r":r},result=list(range(len(values))),output=deepcopy(result),formula=f"emit [{l},{r}]"),"最后一个活动区间在循环外补入答案。",phase="accept"))
    events.append(event(line.id("return res"),complete_state("interval","返回三个不重叠区间",values=[f"[{a},{b}]" for a,b in result],variables={"count":3},result=[0,1,2],output=result,formula=str(result),status="return"),"结果按左端点有序且两两不重叠。",phase="return"))
    return _trace(item,"interval",events,example,result,algorithm="排序后扫描合并",invariant="[l,r] 是尚未输出的合并区间",aha="出现下一个左端点大于 r 时才能安全输出",time="O(n log n)",space="O(log n)",input_data=intervals)


def build_189(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); original=[1,2,3,4,5,6,7]; nums=original.copy(); k=3; events=[]
    events.append(event(line.id("k %= n"),complete_state("generic-array","规范化轮转步数 k=3",values=nums,variables={"n":7,"k":k}),"三次翻转在原数组上完成轮转。",phase="setup"))
    def reverse_segment(a:int,b:int,needle:str,label:str)->None:
        while a<b:
            before=(nums[a],nums[b]); nums[a],nums[b]=nums[b],nums[a]
            events.append(event(line.id(needle),complete_state("generic-array",f"{label}：交换下标 {a} 与 {b}",values=nums,variables={"k":k,"l":a,"r":b},pointers={"l":a,"r":b},active=[a,b],formula=f"{before[0]} ⇄ {before[1]}"),"每次交换都保存翻转后的完整数组。",phase="mutate")); a+=1; b-=1
    reverse_segment(0,len(nums)-1,"reverse(nums.begin(), nums.end())","整体翻转")
    reverse_segment(0,k-1,"reverse(nums.begin(), nums.begin() + k)","翻转前 k 个")
    reverse_segment(k,len(nums)-1,"reverse(nums.begin() + k, nums.end())","翻转剩余部分")
    events.append(event(line.id("reverse(nums.begin() + k"),complete_state("generic-array","轮转完成",values=nums,variables={"k":k},result=list(range(7)),output=nums,formula=str(nums),status="return"),"后三个元素被搬到前方，内部顺序保持。",phase="return"))
    return _trace(item,"generic-array",events,example,nums,algorithm="三次翻转",invariant="每次翻转只改变指定区间内顺序",aha="整体翻转后分别校正两段内部顺序",time="O(n)",space="O(1)",input_data={"nums":original,"k":k})


def build_238(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); nums=[1,2,3,4]; p=[1]*4; events=[event(line.id("vector<int> p"),complete_state("generic-array","答案数组先全部置 1",values=p,variables={"i":None,"s":None},output=[]),"p[i] 先承载左侧乘积。",phase="setup")]
    for i in range(1,4):
        p[i]=p[i-1]*nums[i-1]
        events.append(event(line.id("p[i] = p[i - 1]"),complete_state("generic-array",f"计算 p[{i}] 的左乘积 {p[i]}",values=p,variables={"i":i,"s":None},active=[i],compared=[i-1],formula=f"p[{i}]={p[i-1]}×{nums[i-1]}={p[i]}"),"当前位置不包含 nums[i]。",phase="mutate"))
    suffix=1
    for i in range(3,-1,-1):
        old=p[i]; p[i]*=suffix
        events.append(event(line.id("p[i] *= s"),complete_state("generic-array",f"乘上右侧乘积，p[{i}]={p[i]}",values=p,variables={"i":i,"s":suffix},active=[i],formula=f"{old}×{suffix}={p[i]}"),"左积与右积相乘得到除自身外乘积。",phase="mutate"))
        suffix*=nums[i]
        events.append(event(line.id("s *= nums[i]"),complete_state("generic-array",f"右侧累积更新为 {suffix}",values=p,variables={"i":i,"s":suffix},active=[i],formula=f"s×={nums[i]}"),"suffix 只包含 i 右边的元素。",phase="inspect"))
    events.append(event(line.id("return p"),complete_state("generic-array","返回 [24,12,8,6]",values=p,variables={},result=[0,1,2,3],output=p,formula=str(p),status="return"),"每个位置都恰好缺少自己的因子。",phase="return"))
    return _trace(item,"generic-array",events,example,p,algorithm="前缀积 × 后缀积",invariant="写 p[i] 时左右累积都不包含 nums[i]",aha="用一个答案数组复用左积，再用标量滚动右积",time="O(n)",space="O(1)",input_data=nums)


def build_41(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); original=[3,4,-1,1]; nums=[x-1 for x in original]; events=[]
    events.append(event(line.id("if (x != INT_MIN) x --"),complete_state("generic-array","所有值减 1，目标值映射到同下标",values=nums,variables={"n":4}),"原值 v 应放到下标 v-1，减一后变成值等于下标。",phase="setup"))
    for i in range(4):
        events.append(event(line.id("for (int i = 0"),complete_state("generic-array",f"处理下标 {i}",values=nums,variables={"i":i},pointers={"i":i},active=[i]),"不断把合法值送回自己的下标。",phase="inspect"))
        guard=0
        while 0<=nums[i]<4 and nums[i]!=i and nums[i]!=nums[nums[i]]:
            target=nums[i]; a,b=nums[i],nums[target]; nums[i],nums[target]=nums[target],nums[i]
            events.append(event(line.id("swap(nums[i]"),complete_state("generic-array",f"把值 {a} 交换到下标 {target}",values=nums,variables={"i":i,"target":target},pointers={"i":i,"target":target},active=[i,target],formula=f"swap({a},{b})"),"一次交换至少让一个合法值归位。",phase="mutate")); guard+=1
            if guard>8: break
    answer=5
    for i,x in enumerate(nums):
        events.append(event(line.id("if (nums[i] != i)"),complete_state("generic-array",f"检查 nums[{i}] 是否等于 {i}",values=nums,variables={"i":i},pointers={"i":i},active=[i],formula=f"{x} != {i} → {x!=i}"),"第一个不匹配位置就是最小缺失正数。",phase="compare"))
        if x!=i: answer=i+1; break
    events.append(event(line.id("return i + 1","return n + 1"),complete_state("generic-array",f"返回第一个缺失正数 {answer}",values=nums,variables={"answer":answer},result=[answer-1],output=answer,formula=f"index {answer-1} → value {answer}",status="return"),"1 已归位而 2 缺失。",phase="return"))
    return _trace(item,"generic-array",events,example,2,algorithm="原地哈希归位",invariant="已归位位置 i 满足 nums[i]=i",aha="把值域 [1,n] 映射到下标 [0,n-1]",time="O(n)",space="O(1)",input_data=original)


def build_136(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); nums=[4,1,2,1,2]; value=0; events=[event(line.id("int res = 0"),complete_state("generic-array","异或累积从 0 开始",values=nums,variables={"i":None,"res":0}),"0 是异或单位元。",phase="setup")]
    for i,x in enumerate(nums):
        old=value; value^=x
        events.append(event(line.id("res ^= x"),complete_state("generic-array",f"异或 nums[{i}]={x}，res={value}",values=nums,variables={"i":i,"x":x,"res":value},active=[i],formula=f"{old} xor {x} = {value}"),"成对元素最终互相抵消。",phase="mutate"))
    events.append(event(line.id("return res"),complete_state("generic-array","返回只出现一次的数字 4",values=nums,variables={"res":value},result=[0],output=value,formula="4 xor 1 xor 2 xor 1 xor 2 = 4",status="return"),"交换律让相同数字无论位置都能配对抵消。",phase="return"))
    return _trace(item,"generic-array",events,example,4,algorithm="全数组异或",invariant="res 等于已扫描元素中奇数次出现值的异或",aha="x xor x=0，0 xor x=x",time="O(n)",space="O(1)",input_data=nums)


def build_169(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); nums=[2,2,1,1,1,2,2]; candidate=None; count=0; events=[event(line.id("int r, c = 0"),complete_state("generic-array","候选票数初始化为 0",values=nums,variables={"i":None,"r":None,"c":0}),"票数归零时下一元素可成为新候选。",phase="setup")]
    for i,x in enumerate(nums):
        if count==0: candidate=x; count=1; needle="if (!c)"
        elif candidate==x: count+=1; needle="else if (r == x)"
        else: count-=1; needle="else c --"
        events.append(event(line.id(needle),complete_state("generic-array",f"处理 {x}：候选 {candidate}，票数 {count}",values=nums,variables={"i":i,"x":x,"r":candidate,"c":count},active=[i],formula=f"candidate={candidate}, count={count}"),"不同元素一一抵消不会消除真正多数元素。",phase="mutate"))
    events.append(event(line.id("return r"),complete_state("generic-array","返回多数元素 2",values=nums,variables={"r":candidate,"c":count},result=[0,1,5,6],output=candidate,formula="return 2",status="return"),"多数元素票数超过其余元素总和。",phase="return"))
    return _trace(item,"generic-array",events,example,2,algorithm="Boyer-Moore 投票",invariant="抵消任意不同元素后，多数元素身份不变",aha="把候选与非候选成对删除",time="O(n)",space="O(1)",input_data=nums)


def build_75(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); original=[2,0,2,1,1,0]; nums=original.copy(); i=j=0; k=len(nums)-1; events=[event(line.id("for (int i = 0"),complete_state("array-pointers","三段区域从空开始",values=nums,variables={"i":i,"j":j,"k":k},pointers={"i":i,"j":j,"k":k}),"[0,j) 是 0，(k,n) 是 2，i 扫描未知区。",phase="setup")]
    while i<=k:
        x=nums[i]
        events.append(event(line.id("if (nums[i] == 0)"),complete_state("array-pointers",f"检查 nums[{i}]={x}",values=nums,variables={"i":i,"j":j,"k":k},pointers={"i":i,"j":j,"k":k},active=[i],formula=f"color={x}"),"当前颜色决定交换到哪一侧。",phase="compare"))
        if x==0:
            nums[i],nums[j]=nums[j],nums[i]; old_i,old_j=i,j; i+=1;j+=1; needle="swap(nums[i ++ ], nums[j ++ ])"
            active=[old_i,old_j]
        elif x==2:
            nums[i],nums[k]=nums[k],nums[i]; old_i=i; old_k=k;k-=1; needle="swap(nums[i], nums[k -- ])"; active=[old_i,old_k]
        else:
            old_i=i;i+=1;needle="else i ++";active=[old_i]
        events.append(event(line.id(needle),complete_state("array-pointers",f"归类颜色 {x}",values=nums,variables={"i":i,"j":j,"k":k},pointers={"i":i,"j":j,"k":k},active=active,formula=f"known: [0,{j}) / ({k},{len(nums)})"),"交换后已知区域扩大，未知区域缩小。",phase="mutate"))
    events.append(event(line.id("for (int i = 0"),complete_state("array-pointers","颜色原地排序完成",values=nums,variables={"i":i,"j":j,"k":k},result=list(range(6)),output=nums,formula=str(nums),status="return"),"三段不变量覆盖整个数组。",phase="return"))
    return _trace(item,"array-pointers",events,example,nums,algorithm="荷兰国旗三指针",invariant="[0,j) 全 0，[j,i) 全 1，(k,n) 全 2",aha="遇到 2 交换后 i 不动，因为换回值仍未知",time="O(n)",space="O(1)",input_data=original)


def build_31(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); original=[1,2,3]; nums=original.copy(); k=len(nums)-1; events=[event(line.id("int k = nums.size"),complete_state("array-pointers","从右向左寻找非递增后缀",values=nums,variables={"k":k},pointers={"k":k}),"后缀越长，说明当前排列越接近该前缀下的最大排列。",phase="setup")]
    while k>0 and nums[k-1]>=nums[k]:
        k-=1; events.append(event(line.id("while (k > 0"),complete_state("array-pointers",f"后缀起点左移到 {k}",values=nums,variables={"k":k},pointers={"k":k},active=[k]),"继续寻找第一个上升位置。",phase="inspect"))
    if k<=0:
        nums.reverse(); events.append(event(line.id("reverse(nums.begin(), nums.end())"),complete_state("array-pointers","整个排列已最大，翻转成最小",values=nums,variables={"k":k},result=list(range(len(nums))),formula=str(nums)),"最大排列的下一个排列回到最小。",phase="mutate"))
    else:
        t=k
        while t<len(nums) and nums[t]>nums[k-1]:
            events.append(event(line.id("while (t < nums.size"),complete_state("array-pointers",f"nums[{t}]={nums[t]} 仍大于枢轴 {nums[k-1]}",values=nums,variables={"k":k,"t":t},pointers={"pivot":k-1,"t":t},compared=[k-1,t]),"在递减后缀中寻找最小的更大元素。",phase="compare")); t+=1
        nums[t-1],nums[k-1]=nums[k-1],nums[t-1]
        events.append(event(line.id("swap(nums[t - 1]"),complete_state("array-pointers","交换枢轴与最小更大元素",values=nums,variables={"k":k,"t":t-1},pointers={"pivot":k-1,"t":t-1},active=[k-1,t-1]),"前缀只增加最小可能幅度。",phase="mutate"))
        nums[k:]=reversed(nums[k:])
        events.append(event(line.id("reverse(nums.begin() + k"),complete_state("array-pointers","翻转后缀得到最小排列",values=nums,variables={"k":k},result=list(range(len(nums))),formula=str(nums)),"固定新前缀后，后缀取最小升序。",phase="mutate"))
    events.append(event(line.id("reverse(nums.begin() + k","reverse(nums.begin(), nums.end())"),complete_state("array-pointers","下一个排列为 [1,3,2]",values=nums,variables={},result=[0,1,2],output=nums,formula=str(nums),status="return"),"这是字典序中严格更大的最小排列。",phase="return"))
    return _trace(item,"array-pointers",events,example,nums,algorithm="枢轴交换 + 后缀翻转",invariant="k 右侧始终是当前可确定的最长非递增后缀",aha="前缀做最小增量，后缀重置为最小",time="O(n)",space="O(1)",input_data=original)


def build_121(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); prices=[7,1,5,3,6,4]; minp=10**9; best=0; events=[event(line.id("int res = 0"),complete_state("generic-array","利润从 0 开始，最低价为无穷",values=prices,variables={"i":None,"minp":"∞","res":0}),"每一天只需要此前最低买入价。",phase="setup")]
    for i,p in enumerate(prices):
        profit=p-minp if minp<10**8 else -10**9; best=max(best,profit)
        events.append(event(line.id("res = max"),complete_state("generic-array",f"若今天卖出，利润 {profit if profit>-10**8 else '不可买卖'}",values=prices,variables={"i":i,"price":p,"minp":minp if minp<10**8 else "∞","res":best},active=[i],formula=f"res=max(res,{p}-minp)={best}"),"卖出计算使用的是今天之前的最低价。",phase="compare"))
        minp=min(minp,p)
        events.append(event(line.id("minp = min"),complete_state("generic-array",f"最低价更新/保持为 {minp}",values=prices,variables={"i":i,"price":p,"minp":minp,"res":best},active=[i],formula=f"minp=min(minp,{p})={minp}"),"最低价只会下降。",phase="mutate"))
    events.append(event(line.id("return res"),complete_state("generic-array","返回最大利润 5",values=prices,variables={"minp":minp,"res":best},result=[1,4],output=best,formula="6-1=5",status="return"),"第 1 天买入、第 4 天卖出最优。",phase="return"))
    return _trace(item,"generic-array",events,example,5,algorithm="一次扫描维护历史最低价",invariant="minp 是当前位置之前含当前的最低价格",aha="固定卖出日后最佳买入日就是此前最低价",time="O(n)",space="O(1)",input_data=prices)


def build_55(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); nums=[2,3,1,1,4]; far=0; events=[event(line.id("for (int i = 0, j = 0"),complete_state("generic-array","最远可达位置从 0 开始",values=nums,variables={"i":0,"j":0}),"只要 i 不超过最远边界，就能继续扩展。",phase="setup")]
    for i,x in enumerate(nums):
        events.append(event(line.id("if (j < i)"),complete_state("generic-array",f"检查 i={i} 是否可达",values=nums,variables={"i":i,"j":far},active=[i],formula=f"{far} < {i} → {far<i}"),"若边界落在 i 左边，则出现不可跨越断点。",phase="compare"))
        if far<i:
            output=False; break
        old=far; far=max(far,i+x)
        events.append(event(line.id("j = max"),complete_state("generic-array",f"最远边界从 {old} 扩展到 {far}",values=nums,variables={"i":i,"j":far},active=[i],result=list(range(min(far+1,len(nums)))),formula=f"max({old},{i}+{x})={far}"),"所有不超过 far 的位置都可达。",phase="mutate"))
    else: output=True
    events.append(event(line.id("return true","return false"),complete_state("generic-array","返回可以到达末尾",values=nums,variables={"j":far},result=list(range(len(nums))),output=output,formula="far=8 >= 4",status="return"),"可达边界覆盖最后一个下标。",phase="return"))
    return _trace(item,"generic-array",events,example,True,algorithm="贪心维护最远可达边界",invariant="[0,far] 内所有已需访问位置可达",aha="无需决定具体跳法，只需维护可达并集右端点",time="O(n)",space="O(1)",input_data=nums)


def build_45(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); nums=[2,3,1,1,4]; f=[0]*5; j=0; events=[event(line.id("vector<int> f"),complete_state("dp-table","f[0]=0，指针 j=0",values=f,variables={"i":0,"j":0}),"j 始终寻找最早能覆盖 i 的位置。",phase="setup")]
    for i in range(1,5):
        while j+nums[j]<i:
            old=j;j+=1;events.append(event(line.id("while (j + nums[j] < i)"),complete_state("dp-table",f"位置 {old} 无法覆盖 {i}，j 右移",values=f,variables={"i":i,"j":j},active=[i],compared=[old],formula=f"{old}+{nums[old]} < {i}"),"更早位置若不能覆盖 i，以后也无需再考虑。",phase="mutate"))
        f[i]=f[j]+1
        events.append(event(line.id("f[i] = f[j] + 1"),complete_state("dp-table",f"f[{i}] = f[{j}] + 1 = {f[i]}",values=f,variables={"i":i,"j":j},active=[i],compared=[j],formula=f"f[{i}]={f[j]}+1={f[i]}"),"最早可覆盖位置拥有不更多的跳数。",phase="mutate"))
    events.append(event(line.id("return f[n - 1]"),complete_state("dp-table","返回最少跳数 2",values=f,variables={"j":j},result=[4],output=f[-1],formula="f[4]=2",status="return"),"路径可为 0→1→4。",phase="return"))
    return _trace(item,"dp-table",events,example,2,algorithm="单调指针优化的动态规划",invariant="j 是最早能够一步覆盖 i 的位置",aha="覆盖边界单调右移，所以 j 不回退",time="O(n)",space="O(n)",input_data=nums)


def build_763(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); text="ababcbacadefegdehijhklij"; last={c:i for i,c in enumerate(text)}; start=end=0; output=[]; events=[event(line.id("for (int i = 0; i < S.size(); i ++ ) last"),complete_state("hash-array","记录每个字符最后出现位置",values=list(text),hash={c:i for c,i in sorted(last.items())},variables={"i":None,"start":0,"end":0},output=[]),"分段必须覆盖段内所有字符的最后出现位置。",phase="setup")]
    for i,c in enumerate(text):
        old=end; end=max(end,last[c])
        events.append(event(line.id("end = max"),complete_state("hash-array",f"字符 {c} 把段尾从 {old} 扩到 {end}",values=list(text),hash={ch:pos for ch,pos in sorted(last.items())},variables={"i":i,"start":start,"end":end,"char":c},active=[i],result=list(range(start,end+1)),formula=f"end=max({old},last[{c}]={last[c]})={end}"),"当前段尾是段内已见字符最后位置的最大值。",phase="mutate"))
        if i==end:
            output.append(end-start+1)
            events.append(event(line.id("res.push_back"),complete_state("hash-array",f"在 {i} 封闭一段，长度 {output[-1]}",values=list(text),hash={ch:pos for ch,pos in sorted(last.items())},variables={"i":i,"start":start,"end":end},result=list(range(start,end+1)),output=output.copy(),formula=f"{end}-{start}+1={output[-1]}"),"到达 end 时，段内字符不会出现在后面。",phase="accept"))
            start=end=i+1
    events.append(event(line.id("return res"),complete_state("hash-array","返回分段长度 [9,7,8]",values=list(text),hash={ch:pos for ch,pos in sorted(last.items())},variables={"count":3},result=list(range(len(text))),output=output,formula=str(output),status="return"),"每个字母恰好属于一个分段。",phase="return"))
    return _trace(item,"hash-array",events,example,output,algorithm="最后位置驱动的贪心分段",invariant="end 是当前段内字符最后位置的最大值",aha="扫描到 end 时当前段才能安全闭合",time="O(n)",space="O(|Σ|)",input_data=text)


def _binary_event(line: Lines, nums: list[Any], l: int, r: int, mid: int | None, target: Any, action: str, formula: str, needle: str, *, phase: str = "compare", matrix: list[list[Any]] | None = None) -> dict:
    state = complete_state("binary-search", action, values=nums, variables={"l":l,"r":r,"mid":mid,"target":target}, pointers={"l":l,"r":r,**({"mid":mid} if mid is not None else {})}, active=[] if mid is None else [mid], compared=[l,r] if nums else [], formula=formula)
    if matrix is not None:
        state["matrix"] = matrix
        if mid is not None:
            cols=len(matrix[0]); state["activeCells"]=[f"{mid//cols},{mid%cols}"]
    return event(line.id(needle),state,action,phase=phase)


def build_35(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); nums=[1,3,5,6]; target=2; l,r=0,len(nums); events=[event(line.id("int l = 0, r = nums.size()"),complete_state("binary-search","搜索左闭右开区间 [0,4)",values=nums,variables={"l":l,"r":r,"target":target},pointers={"l":l,"r":r}),"答案始终位于 [l,r] 的边界候选中。",phase="setup")]
    while l<r:
        mid=(l+r)//2
        events.append(_binary_event(line,nums,l,r,mid,target,f"比较 nums[{mid}]={nums[mid]} 与 {target}",f"{nums[mid]} >= {target} → {nums[mid]>=target}","if (nums[mid] >= target)"))
        if nums[mid]>=target:r=mid;needle="r = mid"
        else:l=mid+1;needle="l = mid + 1"
        events.append(_binary_event(line,nums,l,r,None,target,f"收缩为 [{l},{r})",f"next=[{l},{r})",needle,phase="mutate"))
    events.append(event(line.id("return l"),complete_state("binary-search","返回插入下标 1",values=nums,variables={"l":l,"r":r},pointers={"l":l},result=[l],output=l,formula="return 1",status="return"),"下标 1 是第一个不小于 2 的位置。",phase="return"))
    return _trace(item,"binary-search",events,example,1,algorithm="二分查找 lower_bound",invariant="[0,l) 全小于 target，答案不在 [r,n) 左侧",aha="寻找第一个 >= target 的位置",time="O(log n)",space="O(1)",input_data={"nums":nums,"target":target})


def build_74(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); matrix=[[1,3,5,7],[10,11,16,20],[23,30,34,60]]; flat=sum(matrix,[]); target=3;l=0;r=len(flat)-1;events=[event(line.id("int l = 0, r = n * m - 1"),complete_state("binary-search","把矩阵视为一维有序数组",values=flat,matrix=matrix,variables={"l":l,"r":r,"target":target}),"一维下标 x 对应 matrix[x/m][x%m]。",phase="setup")]
    while l<r:
        mid=(l+r)//2
        events.append(_binary_event(line,flat,l,r,mid,target,f"检查 ({mid//4},{mid%4})={flat[mid]}",f"{flat[mid]} >= {target} → {flat[mid]>=target}","if (matrix[mid / m]",matrix=matrix))
        if flat[mid]>=target:r=mid;needle="r = mid"
        else:l=mid+1;needle="l = mid + 1"
        events.append(_binary_event(line,flat,l,r,None,target,f"候选区间缩为 [{l},{r}]",f"next=[{l},{r}]",needle,phase="mutate",matrix=matrix))
    found=flat[r]==target
    final=complete_state("binary-search","目标 3 位于矩阵 (0,1)",values=flat,matrix=matrix,variables={"l":l,"r":r,"target":target},activeCells=["0,1"],result=[r],output=found,formula="matrix[0][1]==3",status="return")
    events.append(event(line.id("return matrix[r / m]"),final,"候选位置与 target 相等，返回 true。",phase="return"))
    return _trace(item,"binary-search",events,example,True,algorithm="展平矩阵二分",invariant="按行展开后的序列保持全局升序",aha="用除法和取模在一维下标与二维坐标间映射",time="O(log mn)",space="O(1)",input_data={"matrix":matrix,"target":target})


def build_34(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code); nums=[5,7,7,8,8,10];target=8;events=[];l=0;r=len(nums)-1
    events.append(event(line.id("int l = 0, r = nums.size() - 1"),complete_state("binary-search","第一轮寻找最左侧 8",values=nums,variables={"l":l,"r":r,"target":target,"phase":"left"},pointers={"l":l,"r":r}),"左边界用下取整 mid。",phase="setup"))
    while l<r:
        mid=(l+r)//2;events.append(_binary_event(line,nums,l,r,mid,target,f"左界比较 nums[{mid}]={nums[mid]}",f"{nums[mid]} >= 8 → {nums[mid]>=8}","if (nums[mid] >= target)"))
        if nums[mid]>=target:r=mid;needle="r = mid"
        else:l=mid+1;needle="l = mid + 1"
        events.append(_binary_event(line,nums,l,r,None,target,f"左界区间 [{l},{r}]",f"left search=[{l},{r}]",needle,phase="mutate"))
    left=l
    events.append(event(line.id("int L = r"),complete_state("binary-search",f"最左位置确认为 {left}",values=nums,variables={"L":left,"l":left,"r":left},pointers={"L":left},result=[left],formula=f"L={left}"),"确认存在后保存左边界。",phase="accept"))
    l=0;r=len(nums)-1
    while l<r:
        mid=(l+r+1)//2;events.append(_binary_event(line,nums,l,r,mid,target,f"右界比较 nums[{mid}]={nums[mid]}",f"{nums[mid]} <= 8 → {nums[mid]<=8}","if (nums[mid] <= target)"))
        if nums[mid]<=target:l=mid;needle="l = mid"
        else:r=mid-1;needle="r = mid - 1"
        events.append(_binary_event(line,nums,l,r,None,target,f"右界区间 [{l},{r}]",f"right search=[{l},{r}]",needle,phase="mutate"))
    answer=[left,r]
    events.append(event(line.id("return {L, r}"),complete_state("binary-search","返回范围 [3,4]",values=nums,variables={"L":left,"r":r},pointers={"L":left,"R":r},result=list(range(left,r+1)),output=answer,formula="[3,4]",status="return"),"两个二分分别锁定等值区间两端。",phase="return"))
    return _trace(item,"binary-search",events,example,answer,algorithm="两次二分查找左右边界",invariant="第一轮保留最左候选，第二轮保留最右候选",aha="mid 取整方向必须与收缩公式配套",time="O(log n)",space="O(1)",input_data={"nums":nums,"target":target})


def build_33(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code);nums=[4,5,6,7,0,1,2];target=0;l=0;r=6;events=[event(line.id("int l = 0, r = nums.size() - 1"),complete_state("binary-search","第一轮寻找旋转点左端",values=nums,variables={"l":l,"r":r,"target":target},pointers={"l":l,"r":r}),"先找到大段的最后一个位置。",phase="setup")]
    while l<r:
        mid=(l+r+1)//2;events.append(_binary_event(line,nums,l,r,mid,target,f"判断 nums[{mid}]={nums[mid]} 是否在左大段",f"{nums[mid]} >= {nums[0]} → {nums[mid]>=nums[0]}","if (nums[mid] >= nums[0])"))
        if nums[mid]>=nums[0]:l=mid;needle="l = mid"
        else:r=mid-1;needle="r = mid - 1"
        events.append(_binary_event(line,nums,l,r,None,target,f"旋转点候选 [{l},{r}]",f"pivot range=[{l},{r}]",needle,phase="mutate"))
    pivot=r
    if target>=nums[0]:l,r=0,pivot
    else:l,r=pivot+1,len(nums)-1
    events.append(event(line.id("if (target >= nums[0])"),complete_state("binary-search",f"target 位于有序区间 [{l},{r}]",values=nums,variables={"l":l,"r":r,"pivot":pivot,"target":target},pointers={"l":l,"r":r},result=list(range(l,r+1)),formula=f"target>=nums[0] → {target>=nums[0]}"),"旋转点把数组切成两个独立有序段。",phase="inspect"))
    while l<r:
        mid=(l+r)//2;events.append(_binary_event(line,nums,l,r,mid,target,f"有序段内比较 nums[{mid}]={nums[mid]}",f"{nums[mid]} >= {target} → {nums[mid]>=target}","if (nums[mid] >= target)"))
        if nums[mid]>=target:r=mid;needle="r = mid"
        else:l=mid+1;needle="l = mid + 1"
        events.append(_binary_event(line,nums,l,r,None,target,f"目标区间 [{l},{r}]",f"next=[{l},{r}]",needle,phase="mutate"))
    answer=r if nums[r]==target else -1
    events.append(event(line.id("return r"),complete_state("binary-search","返回目标下标 4",values=nums,variables={"r":r,"target":target},pointers={"r":r},result=[r],output=answer,formula="nums[4]=0",status="return"),"第二轮二分命中旋转后的有序段。",phase="return"))
    return _trace(item,"binary-search",events,example,4,algorithm="旋转点二分 + 有序段二分",invariant="每一轮都只在单调判定区间内收缩",aha="先用 nums[0] 识别两段，再做普通二分",time="O(log n)",space="O(1)",input_data={"nums":nums,"target":target})


def build_153(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code);nums=[3,4,5,1,2];l=0;r=4;events=[event(line.id("int l = 0, r = nums.size() - 1"),complete_state("binary-search","最小值在旋转断点右侧",values=nums,variables={"l":l,"r":r},pointers={"l":l,"r":r}),"未旋转时 nums[r]>=nums[l] 可直接返回首元素。",phase="setup")]
    while l<r:
        mid=(l+r)//2;events.append(_binary_event(line,nums,l,r,mid,nums[0],f"比较 nums[{mid}]={nums[mid]} 与首值 {nums[0]}",f"{nums[mid]} < {nums[0]} → {nums[mid]<nums[0]}","if (nums[mid] < nums[0])"))
        if nums[mid]<nums[0]:r=mid;needle="r = mid"
        else:l=mid+1;needle="l = mid + 1"
        events.append(_binary_event(line,nums,l,r,None,nums[0],f"最小值候选 [{l},{r}]",f"next=[{l},{r}]",needle,phase="mutate"))
    events.append(event(line.id("return nums[r]"),complete_state("binary-search","返回最小值 1",values=nums,variables={"l":l,"r":r},pointers={"r":r},result=[r],output=nums[r],formula="nums[3]=1",status="return"),"断点后的第一个元素就是全局最小值。",phase="return"))
    return _trace(item,"binary-search",events,example,1,algorithm="按首元素划分旋转数组",invariant="最小值始终位于闭区间 [l,r]",aha="右半段元素都严格小于 nums[0]",time="O(log n)",space="O(1)",input_data=nums)


def build_4(item: dict, code: str, example: tuple[str, str]) -> dict:
    line=Lines(code);a=[1,3];b=[2];values=["A:1","A:3","B:2"];events=[event(line.id("int tot = nums1.size"),complete_state("binary-search","总长度 3，需要第 2 小元素",values=values,variables={"i":0,"j":0,"k":2,"tot":3}),"奇数长度中位数就是第 (tot/2+1) 小。",phase="setup")]
    i=j=0;k=2
    while True:
        if len(a)-i>len(b)-j:
            a,b=b,a;i,j=j,i; values=["A:2","B:1","B:3"]
            events.append(event(line.id("if (nums1.size() - i >"),complete_state("binary-search","交换参数，保证第一数组剩余更短",values=values,variables={"i":i,"j":j,"k":k},formula="remaining A <= remaining B"),"让 si 不会越过较短数组。",phase="mutate"))
        if k==1:
            answer=b[j] if i==len(a) else min(a[i],b[j]);break
        if i==len(a):answer=b[j+k-1];break
        si=min(len(a),i+k//2);sj=j+k-k//2
        events.append(event(line.id("int si = min"),complete_state("binary-search",f"比较 A[{si-1}]={a[si-1]} 与 B[{sj-1}]={b[sj-1]}",values=values,variables={"i":i,"j":j,"k":k,"si":si,"sj":sj},active=[si-1],formula=f"{a[si-1]} > {b[sj-1]} → {a[si-1]>b[sj-1]}"),"较小的分割前缀不可能包含第 k 小元素。",phase="compare"))
        if a[si-1]>b[sj-1]:
            removed=sj-j;j=sj;k-=removed;needle="return find(nums1, i, nums2, sj"
        else:
            removed=si-i;i=si;k-=removed;needle="return find(nums1, si, nums2, j"
        events.append(event(line.id(needle),complete_state("binary-search",f"排除 {removed} 个较小元素，k={k}",values=values,variables={"i":i,"j":j,"k":k},formula=f"k -= {removed}"),"每次至少排除 k/2 个不可能答案。",phase="mutate"))
    events.append(event(line.id("return find(nums1"),complete_state("binary-search","第 2 小元素为 2，即中位数",values=["A:1","A:3","B:2"],variables={"k":1},result=[2],output=float(answer),formula="median=2",status="return"),"合并有序序列 [1,2,3] 的中点是 2。",phase="return"))
    return _trace(item,"binary-search",events,example,2.0,algorithm="递归淘汰第 k 小元素",invariant="每次递归保留原问题中尚未排除的第 k 小",aha="比较两个 k/2 分割点即可排除一整段",time="O(log(m+n))",space="O(log(m+n))",input_data={"nums1":[1,3],"nums2":[2]})


BUILDERS: dict[int, Callable[[dict, str, tuple[str, str]], dict]] = {
    4: build_4,
    3: build_3,
    11: build_11,
    15: build_15,
    31: build_31,
    33: build_33,
    34: build_34,
    35: build_35,
    41: build_41,
    45: build_45,
    49: build_49,
    53: build_53,
    55: build_55,
    56: build_56,
    74: build_74,
    75: build_75,
    121: build_121,
    128: build_128,
    136: build_136,
    153: build_153,
    169: build_169,
    189: build_189,
    238: build_238,
    239: build_239,
    283: build_283,
    438: build_438,
    560: build_560,
    763: build_763,
}
