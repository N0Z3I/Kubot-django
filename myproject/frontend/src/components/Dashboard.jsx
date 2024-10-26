import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [studentProfile, setStudentProfile] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);
  const [groupCourseData, setGroupCourseData] = useState([]);
  const [gradesData, setGradesData] = useState([]);
  const [studentEducationData, setStudentEducationData] = useState(null);
  const [gpaxData, setGpaxData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const accessToken = Cookies.get("access");

  useEffect(() => {
    if (!accessToken) {
      toast.error("You are not logged in. Please log in first.");
      navigate("/login");
      return;
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/auth/myku-data/");
      console.log("API Response: ", res.data);

      if (res.status === 200) {
        const data = res.data;

        setStudentProfile(data.student_profile || null);
        setScheduleData(data.schedule_data || []);
        setGroupCourseData(data.group_course_data || []);
        setGradesData(data.grades_data || []);
        setStudentEducationData(data.student_education_data || null);
        setGpaxData(data.gpax_data || null);
      } else {
        toast.error("Failed to load data.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Unable to retrieve data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("access");
    Cookies.remove("refresh");
    Cookies.remove("user");
    toast.success("Logout successful.");
    navigate("/login");
  };

  const semesterNames = { 0: "ฤดูร้อน", 1: "ภาคต้น", 2: "ภาคปลาย" };

  // ฟังก์ชันเรียงปีการศึกษาและภาคเรียนจากใหม่ไปเก่า
  const sortGradesData = (gradesData) => {
    const sorted = Object.entries(gradesData).sort(([keyA], [keyB]) => {
      const [yearA, termA] = keyA
        .match(/(\d+)\/(\d)/)
        .slice(1, 3)
        .map(Number);
      const [yearB, termB] = keyB
        .match(/(\d+)\/(\d)/)
        .slice(1, 3)
        .map(Number);

      // เรียงตามปีจากใหม่ไปเก่า จากนั้นเรียงภาคจากภาคปลายไปต้น
      if (yearA !== yearB) return yearB - yearA;
      return termB - termA;
    });

    return sorted;
  };

  return (
    <div className="dashboard-container">
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h4>Student Information</h4>
        <button onClick={handleLogout} className="btn btn-danger logout-btn">
          Logout
        </button>
      </header>

      {isLoading ? (
        <div className="text-center">
          <p>Loading...</p>
        </div>
      ) : (
        <div className="row gx-5 gy-4">
          {studentProfile && (
            <div className="col-lg-6 col-md-8 mx-auto">
              <div className="profile-cards shadow-sm text-center p-4">
                <h4 className="card-title mb-4">Personal Information</h4>
                <p>
                  <strong>ชื่อ-นามสกุล (TH):</strong> {studentProfile.name_th}
                </p>
                <p>
                  <strong>ชื่อ-นามสกุล (EN):</strong> {studentProfile.name_en}
                </p>
                <p>
                  <strong>เพศ:</strong> {studentProfile.gender}
                </p>
                <p>
                  <strong>รหัสนิสิต:</strong> {studentProfile.std_code}
                </p>
                <p>
                  <strong>เบอร์โทร:</strong> {studentProfile.phone}
                </p>
                <p>
                  <strong>Email:</strong> {studentProfile.email}
                </p>

                {studentEducationData && (
                  <>
                    <h4>Educational Information</h4>
                    <p>
                      <strong>สถานภาพ:</strong> {studentEducationData.status}
                    </p>
                    <p>
                      <strong>ชื่อปริญญา:</strong>{" "}
                      {studentEducationData.degree_name}
                    </p>
                    <p>
                      <strong>คณะ:</strong>{" "}
                      {studentEducationData.faculty_name_th}
                    </p>
                    <p>
                      <strong>สาขา:</strong>{" "}
                      {studentEducationData.major_name_th}
                    </p>
                  </>
                )}

                {gpaxData && (
                  <div className="card shadow-sm text-center p-4">
                    <h4>Grade Result</h4>
                    <p>
                      <strong>หน่วยกิตสะสม:</strong> {gpaxData.total_credit}
                    </p>
                    <p>
                      <strong>เกรดเฉลี่ยสะสม:</strong> {gpaxData.gpax}
                    </p>
                  </div>
                )}

                {sortGradesData(gradesData).map(
                  ([key, { gpa, total_credits, courses }], index) => {
                    const [year, term] = key.match(/(\d+)\/(\d)/).slice(1, 3);
                    const semesterName = semesterNames[parseInt(term, 10)];

                    return (
                      <div
                        key={index}
                        className="semester-card mb-4 p-3 shadow-sm"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <h5>{`${semesterName} ${year}`}</h5>
                          <p>
                            หน่วยกิตรวม: {total_credits || "N/A"} | GPA:{" "}
                            {gpa || "N/A"}
                          </p>
                        </div>

                        <div className="course-list mt-3">
                          {courses.map((course, cIdx) => (
                            <div
                              key={cIdx}
                              className="d-flex justify-content-between align-items-center course-item mb-2 p-2"
                            >
                              <div className="d-flex flex-column">
                                <span>{course.subject_code}</span>
                                <br></br>
                                <span className="text-muted">
                                  {course.subject_name_th} /{" "}
                                  {course.subject_name_en || "N/A"}
                                </span>
                              </div>
                              <div className="d-flex align-items-center">
                                <span className="me-3">
                                  หน่วยกิต: {course.credit}
                                </span>
                                <span>เกรด: {course.grade}</span>
                              </div>
                              <br></br>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}

                {scheduleData.length > 0 && (
                  <>
                    <h4>Schedule</h4>
                    {scheduleData.map((schedule, index) => (
                      <div key={index}>
                        <h5>
                          ปีการศึกษา: {schedule.academic_year}, ภาคการศึกษา:{" "}
                          {schedule.semester}
                        </h5>
                        {groupCourseData.map((course, idx) => (
                          <div key={idx}>
                            <p>
                              <strong>วิชา:</strong> {course.subject_name}
                            </p>
                            <p>
                              <strong>อาจารย์:</strong> {course.teacher_name}
                            </p>
                            <p>
                              <strong>วัน:</strong> {course.day_w}
                            </p>
                            <p>
                              <strong>เวลา:</strong> {course.time_from} -{" "}
                              {course.time_to}
                            </p>
                            <p>
                              <strong>ห้อง:</strong> {course.room_name_th}
                            </p>
                            <hr />
                          </div>
                        ))}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
