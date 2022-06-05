
export function shouldComponentUpdate(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode
    const { props: nextProps } = nextVNode
    console.log('prevProps', prevProps, nextProps);

    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true
        }
    }

    return false
}
