// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import API from "../services/API";
import { useNavigate } from "react-router-dom";


export default function Dashboard() {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [editingTask, setEditingTask] = useState(null);
    const [updatedTitle, setUpdatedTitle] = useState("");


    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await API.get("/task");
            setTasks(res.data);
        } catch (err) {
            console.error(err);
            if (err?.response?.status === 401) {
                // token expired or invalid
                localStorage.removeItem("token");
                navigate("/");
            }
        } finally {
            setLoading(false);
        }
    };

    const addTask = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        try {
            await API.post("/task", { title, isCompleted: false });
            setTitle("");
            fetchTasks();
        } catch (err) {
            console.error(err);
            alert("Failed to add task");
        }
    };

  const toggleComplete = async (task) => {
  console.log("toggle clicked for:", task);

  const payload = {
    title: task.title,
    isCompleted: !task.isCompleted
  };

  console.log("PUT ->", `/task/${task.id}`, payload);

  // optimistic update (optional) — keep a copy to rollback if fail
  const previous = tasks;
  setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t));

  try {
    const res = await API.put(`/task/${task.id}`, payload);
    console.log("PUT response:", res.status, res.data);

    // if server returns the updated task, use it:
    if (res?.data) {
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
    } else {
      // otherwise re-fetch to sync server state
      fetchTasks();
    }
  } catch (err) {
    console.error("toggleComplete error:", err, err?.response?.status, err?.response?.data);
    alert("Failed to update task. See console.");
    // rollback
    setTasks(previous);
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      navigate("/");
    }
  }
};


const startEditing = (task) => {
  setEditingTask(task);
  setUpdatedTitle(task.title);
};
const saveUpdate = async () => {
  if (!editingTask) return;

  const payload = { title: updatedTitle, isCompleted: editingTask.isCompleted };

  try {
    const res = await API.put(`/task/${editingTask.id}`, payload);
    console.log("Update response:", res.data);

    // تحديث الـ state
    setTasks(prev =>
      prev.map(t => t.id === editingTask.id ? res.data : t)
    );

    // رجوع للوضع العادي
    setEditingTask(null);
    setUpdatedTitle("");
  } catch (err) {
    console.error("Error updating task:", err);
    alert("Failed to update task");
  }
};

// cancel edit
const cancelEdit = () => {
  setEditingTask(null);
  setUpdatedTitle("");
};


    const deleteTask = async (id) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await API.delete(`/task/${id}`);
            fetchTasks();
        } catch (err) {
            console.error(err);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    useEffect(() => {
        fetchTasks();
        // eslint-disable-next-line
    }, []);

    return (
        <div style={{ maxWidth: 700, margin: "30px auto", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>My Tasks</h2>
                <button onClick={logout}>Logout</button>
            </div>

            <form onSubmit={addTask} style={{ marginBottom: 16 }}>
                <input
                    type="text"
                    placeholder="New task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: "70%", padding: 8 }}
                />
                <button type="submit" style={{ marginLeft: 8 }}>Add</button>
            </form>

            {loading ? <p>Loading...</p> : (
               <ul className="task-list">
  {tasks.map(task => (
    <li key={task.id} className={`task-item ${task.isCompleted ? "completed" : ""}`}>
      {editingTask && editingTask.id === task.id ? (
        <div className="edit-section">
          <input
            type="text"
            className="edit-input"
            value={updatedTitle}
            onChange={(e) => setUpdatedTitle(e.target.value)}
          />
          <div className="edit-buttons">
            <button className="save-btn" onClick={saveUpdate}>💾 Save</button>
            <button className="cancel-btn" onClick={cancelEdit}>❌ Cancel</button>
          </div>
        </div>
      ) : (
        <div className="view-section">
          <span className="task-title">{task.title}</span>
          <div className="task-buttons">
            <button className="toggle-btn" onClick={() => toggleComplete(task)}>✔️</button>
            <button className="edit-btn" onClick={() => startEditing(task)}>✏️</button>
            <button className="delete-btn" onClick={() => deleteTask(task.id)}>🗑</button>
          </div>
        </div>
      )}
    </li>
  ))}
</ul>

            )}
        </div>
    );
}
