const queue: any[] = []
let isFlushPending = false

export function nextTick(fn) {
    // 创建微任务
    return fn ? Promise.resolve().then(fn) : Promise.resolve()
}

export function queueJobs(job) {
    if (queue.indexOf(job) === -1) {
        queue.push(job)
    }

    queueFlush()
}

function queueFlush() {
    if (isFlushPending) return
    isFlushPending = true

    nextTick(flushJobs)
}

function flushJobs() {
    isFlushPending = false
    let job
    while ((job = queue.shift())) {
        job && job()
    }
}
