import React, { useState } from "react";
import axios from "axios";

const TeacherCreater = () => {
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    date: "",
    due_date: "",
    event_type: "assignment",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/v1/event/create/", eventData);
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Create Event</button>
    </form>
  );
};
export default TeacherCreater;
