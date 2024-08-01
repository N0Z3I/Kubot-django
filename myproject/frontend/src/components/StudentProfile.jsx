import React, { useEffect, useState } from "react";

const StudentProfile = () => {
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("studentData"));
    if (data) {
      setStudentData(data);
    }
  }, []);

  if (!studentData) {
    return <div>Loading...5555</div>;
  }

  return (
    <div>
      <h1>Student Profile</h1>
      <p>Student Code: {studentData.student_code}</p>
      {/* Display other student data as needed */}
    </div>
  );
};

export default StudentProfile;
