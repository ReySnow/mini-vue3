import { NodeTypes } from "../ast";
import { isText } from "../utils";

// 将element 中连续的 text 和 插值 生成 组合类型节点
// 为了处理 text 和 插值 生成代码之间的加号
export function transformText(node) {
    if (node.type === NodeTypes.ELEMENT) {
        return () => {
            // 退出后执行
            let { children } = node
            let currentContainer
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                // children[i] 替换
                                currentContainer = children[i] = {
                                    type: NodeTypes.COMPOUND_EXPRESSION,
                                    children: [child]
                                }
                                children.splice(j, 1)
                                j--// 被剔除了所以要先减
                            }
                            currentContainer.children.push(' + ')
                            currentContainer.children.push(next)
                        } else {
                            currentContainer = undefined
                            break
                        }
                    }
                }
            }
        }
    }
}