import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../utils/axiosInstance";

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    event_type: "",
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editFormRef = useRef(null); // Create a reference for the edit form

  useEffect(() => {
    fetchCourses();
    fetchAnnouncements();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get("/auth/teacher/courses/");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axiosInstance.get("/auth/event/list/");
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const handleCourseSelect = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axiosInstance.put(`/auth/event/update/${editingId}/`, {
          ...newAnnouncement,
          course: selectedCourse,
        });
        setIsEditing(false);
        setEditingId(null);
      } else {
        await axiosInstance.post("/auth/event/create/", {
          ...newAnnouncement,
          course: selectedCourse,
        });
      }
      setNewAnnouncement({
        event_type: "",
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
      });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error creating/updating announcement:", error);
    }
  };

  const handleEdit = (announcement) => {
    setIsEditing(true);
    setEditingId(announcement.id);
    setSelectedCourse(announcement.course);
    setNewAnnouncement({
      event_type: announcement.event_type,
      title: announcement.title,
      description: announcement.description,
      start_date: announcement.start_date,
      end_date: announcement.end_date,
      start_time: announcement.start_time,
      end_time: announcement.end_time,
    });

    // Scroll to the edit form when an announcement is selected for editing
    editFormRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/auth/event/delete/${id}/`);
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
    }
  };

  return (
    <div>
      <h2>Teacher Dashboard</h2>

      <h3>Your Courses</h3>
      <ul>
        {courses.map((course) => (
          <li key={course.id}>
            <h4>
              {course.subject_name} ({course.subject_code})
            </h4>
            <p>
              <strong>Period:</strong> {course.period_date}
            </p>
            <p>
              <strong>Day:</strong> {course.day_w}
            </p>
            <p>
              <strong>Time:</strong> {course.time_from} - {course.time_to}
            </p>
            <p>
              <strong>Room:</strong> {course.room_name_th}
            </p>
          </li>
        ))}
      </ul>

      <h3>Select Course for Announcement</h3>
      <select onChange={handleCourseSelect} value={selectedCourse}>
        <option value="">Select a course</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.subject_name}
          </option>
        ))}
      </select>

      <h3 ref={editFormRef}>
        {isEditing ? "Edit Announcement" : "Create Announcement"}
      </h3>
      <form onSubmit={handleAnnouncementSubmit}>
        <label>
          Type:
          <select
            value={newAnnouncement.event_type}
            onChange={(e) =>
              setNewAnnouncement({
                ...newAnnouncement,
                event_type: e.target.value,
              })
            }
          >
            <option value="">Select type</option>
            <option value="makeup_class">Makeup Class</option>
            <option value="assignment">Assignment</option>
          </select>
        </label>
        <input
          type="text"
          placeholder="Title"
          value={newAnnouncement.title}
          onChange={(e) =>
            setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
          }
          required
        />
        <textarea
          placeholder="Description"
          value={newAnnouncement.description}
          onChange={(e) =>
            setNewAnnouncement({
              ...newAnnouncement,
              description: e.target.value,
            })
          }
          required
        ></textarea>

        <input
          type="date"
          placeholder="Start Date"
          value={newAnnouncement.start_date}
          onChange={(e) =>
            setNewAnnouncement({
              ...newAnnouncement,
              start_date: e.target.value,
            })
          }
          required
        />
        <input
          type="time"
          placeholder="Start Time"
          value={newAnnouncement.start_time}
          onChange={(e) =>
            setNewAnnouncement({
              ...newAnnouncement,
              start_time: e.target.value,
            })
          }
          required
        />

        <input
          type="date"
          placeholder="End Date"
          value={newAnnouncement.end_date}
          onChange={(e) =>
            setNewAnnouncement({ ...newAnnouncement, end_date: e.target.value })
          }
          required
        />
        <input
          type="time"
          placeholder="End Time"
          value={newAnnouncement.end_time}
          onChange={(e) =>
            setNewAnnouncement({ ...newAnnouncement, end_time: e.target.value })
          }
          required
        />

        <button type="submit">
          {isEditing ? "Update Announcement" : "Create Announcement"}
        </button>
      </form>

      <h3>Existing Announcements</h3>
      <ul>
        {announcements.map((announcement) => (
          <li key={announcement.id}>
            <h4>{announcement.title}</h4>
            <p>
              <strong>Type:</strong> {announcement.event_type}
            </p>
            <p>
              <strong>Description:</strong> {announcement.description}
            </p>
            <p>
              <strong>Period:</strong> {announcement.start_date} -{" "}
              {announcement.end_date} {announcement.start_time} -{" "}
              {announcement.end_time}
            </p>
            <button onClick={() => handleEdit(announcement)}>Edit</button>
            <button onClick={() => handleDelete(announcement.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TeacherDashboard;
