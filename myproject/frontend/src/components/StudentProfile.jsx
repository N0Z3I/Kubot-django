import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const StudentProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [responseData, setResponseData] = useState(location.state);

  useEffect(() => {
    if (!responseData) {
      const userFromCookies = Cookies.get("user");
      if (userFromCookies) {
        setResponseData(JSON.parse(userFromCookies));
      } else {
        navigate("/ku_signup");
      }
    }
  }, [responseData, navigate]);

  const handleLogout = () => {
    Cookies.remove("user");
    Cookies.remove("access");
    Cookies.remove("refresh");
    navigate("/ku_signup");
    toast.success("Logout successful");
  };

  if (!responseData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <header>
        <h5 className="logo"></h5>
        <nav className="navigation">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </nav>
      </header>
      <section id="profile-information">
        <div className="container">
          <h1>Profile Information</h1>
          <div>
            <p>Username: {responseData.user.username}</p>
            <p>ID: {responseData.user.id}</p>
            <p>Full Name: {responseData.user.full_name}</p>
            <p>Email: {responseData.user.email}</p>
          </div>
        </div>
      </section>
      {/* <section id="schedule">
        <div className="container">
          <h1>Schedule</h1>
          <div>
            {responseData.user.schedule ? (
              <pre>{JSON.stringify(responseData.user.schedule, null, 2)}</pre>
            ) : (
              <p>No schedule available</p>
            )}
          </div>
          <div>
            {responseData.user.group_course ? (
              <pre>
                {JSON.stringify(responseData.user.group_course, null, 2)}
              </pre>
            ) : (
              <p>No course available</p>
            )}
          </div>
        </div>
      </section> */}
      <section id="schedule">
        <div className="container">
          <h1>Schedule</h1>
          <div>
            {responseData.user.schedule &&
            responseData.user.schedule.results.length > 0 ? (
              <div>
                {responseData.user.schedule.results.map((item, index) => (
                  <div key={index}>
                    <h2>Academic Year: {item.academicYr}</h2>
                    <h3>Semester: {item.semester}</h3>
                  </div>
                ))}
              </div>
            ) : (
              <p>No schedule available</p>
            )}
          </div>
          <div>
            {responseData.user.group_course &&
            responseData.user.group_course.results.length > 0 ? (
              <div>
                {responseData.user.group_course.results.map((item, index) => (
                  <div key={index}>
                    <h2>Period Date: {item.peroid_date}</h2>
                    {item.course.map((course, courseIndex) => (
                      <div key={courseIndex}>
                        <h3>Course Section ID: {course.section_id}</h3>
                        <p>Group Header: {course.groupheader}</p>
                        <p>
                          Week Start Day:{" "}
                          {new Date(course.weekstartday).toLocaleDateString()}
                        </p>
                        <p>
                          Week End Day:{" "}
                          {new Date(course.weekendday).toLocaleDateString()}
                        </p>
                        <p>Student ID: {course.std_id}</p>
                        <p>Subject Code: {course.subject_code}</p>
                        <p>Subject Name (TH): {course.subject_name_th}</p>
                        <p>Subject Name (EN): {course.subject_name_en}</p>
                        <p>Section Code: {course.section_code}</p>
                        <p>Section Type (TH): {course.section_type_th}</p>
                        <p>Section Type (EN): {course.section_type_en}</p>
                        <p>Student Status Code: {course.student_status_code}</p>
                        <p>Student Status (TH): {course.std_status_th}</p>
                        <p>Student Status (EN): {course.std_status_en}</p>
                        <p>Teacher Name (TH): {course.teacher_name}</p>
                        <p>Teacher Name (EN): {course.teacher_name_en}</p>
                        <p>Day with Course: {course.day_w_c}</p>
                        <p>Time From: {course.time_from}</p>
                        <p>Time To: {course.time_to}</p>
                        <p>Day of the Week: {course.day_w}</p>
                        <p>Room Name (TH): {course.room_name_th}</p>
                        <p>Room Name (EN): {course.room_name_en}</p>
                        <p>Start Time (Minutes): {course.time_start}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p>No course available</p>
            )}
          </div>
        </div>
      </section>
      s
    </div>
  );
};
export default StudentProfile;
