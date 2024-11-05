import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    event_type: "",
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get("/auth/teacher/courses/");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleCourseSelect = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/auth/event/create/", {
        ...newAnnouncement,
        course: selectedCourse,
      });
      console.log("Announcement created:", response.data);
      // Reset the form after submission
      setNewAnnouncement({
        event_type: "",
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
      });
    } catch (error) {
      console.error("Error creating announcement:", error);
    }
  };

  return (
    <div>
      <h2>Teacher Dashboard</h2>

      {/* รายการวิชาที่สอน */}
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

      {/* เลือกวิชา */}
      <h3>Select Course for Announcement</h3>
      <select onChange={handleCourseSelect} value={selectedCourse}>
        <option value="">Select a course</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.subject_name}
          </option>
        ))}
      </select>

      {/* ฟอร์มแจ้งวันชดเชย/ส่งงาน */}
      <h3>Create Announcement</h3>
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
            required
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

        {/* กำหนดวันและเวลาสำหรับกิจกรรม */}
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

        <button type="submit">Create Announcement</button>
      </form>
    </div>
  );
};

export default TeacherDashboard;
