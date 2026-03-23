import Task from '../models/Task.js'

const serializeTask = (task) => ({
  id: task._id,
  session_id: task.sessionId,
  session_title: task.sessionTitle,
  title: task.title,
  owner_role: task.ownerRole,
  status: task.status,
  priority: task.priority,
  due_date: task.dueDate,
  created_at: task.createdAt,
  updated_at: task.updatedAt,
})

export const getGlobalTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ updatedAt: -1, createdAt: -1 })
    return res.status(200).json(tasks.map(serializeTask))
  } catch (error) {
    return res.status(500).json({ message: 'Server error while loading tasks' })
  }
}

export const updateTask = async (req, res) => {
  try {
    const updates = {}

    if (req.body.status) {
      updates.status = req.body.status
    }

    if (req.body.priority) {
      updates.priority = req.body.priority
    }

    if (req.body.title) {
      updates.title = req.body.title.trim()
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true, runValidators: true },
    )

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    return res.status(200).json({
      message: 'Task updated successfully',
      task: serializeTask(task),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error while updating task' })
  }
}
