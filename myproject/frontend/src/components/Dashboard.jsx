import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [grades, setGrades] = useState([]);
  const [groupCourse, setGroupCourse] = useState([]);
  const [studentEducation, setStudentEducation] = useState(null);
  const [gpax, setGpax] = useState(null);

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const accessToken = Cookies.get("access");

  useEffect(() => {
    if (!accessToken) {
      toast.error("คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อน");
      navigate("/login");
    } else {
      fetchStudentData();
    }
  }, []);

  const fetchStudentData = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/auth/myku-data/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("Response from /auth/myku-data/:", res);

      if (res.status === 200) {
        const data = res.data;
        console.log("Data received:", data);

        if (data && data.results) {
          const results = data.results;

          if (data.student_data && data.student_data.results) {
            setStudentData(data.student_data.results.stdPersonalModel);
            console.log(
              "Student Data set:",
              data.student_data.results.stdPersonalModel
            );
          }

          if (results.schedule_data && results.schedule_data.results) {
            setSchedule(results.schedule_data.results);
            console.log("Schedule Data set:", results.schedule_data.results);
          }

          if (results.announce_data && results.announce_data.results) {
            setAnnouncements(results.announce_data.results);
            console.log(
              "Announcements Data set:",
              results.announce_data.results
            );
          }

          if (results.grades_data && results.grades_data.results) {
            setGrades(results.grades_data.results);
            console.log("Grades Data set:", results.grades_data.results);
          }

          if (results.group_course_data && results.group_course_data.results) {
            setGroupCourse(results.group_course_data.results);
            console.log(
              "Group Course Data set:",
              results.group_course_data.results
            );
          }

          if (
            results.student_education_data &&
            results.student_education_data.results
          ) {
            setStudentEducation(results.student_education_data.results);
            console.log(
              "Student Education Data set:",
              results.student_education_data.results
            );
          }

          if (results.gpax_data && results.gpax_data.results.length > 0) {
            setGpax(results.gpax_data.results[0]);
            console.log("GPAX Data set:", results.gpax_data.results[0]);
          }
        } else {
          toast.error("ไม่สามารถดึงข้อมูลนักศึกษาได้");
          console.log("Results not found in data.");
        }
      } else {
        toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
        console.log("Failed to fetch data from server. Status:", res.status);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชัน handleLogout
  const handleLogout = () => {
    // ลบ Token
    Cookies.remove("access");
    // นำผู้ใช้ไปยังหน้า Login
    navigate("/login");
    // แสดงข้อความแจ้งเตือน
    toast.success("ออกจากระบบสำเร็จ");
  };

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
      <h4>Dashboard</h4>
      {isLoading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : (
        <div>
          {studentData ? (
            <>
              <h2>ข้อมูลส่วนตัว</h2>
              <p>ยินดีต้อนรับ {studentData.nameTh}</p>
              <p>รหัสนิสิต: {studentData.stdId}</p>
              <p>อีเมล: {studentData.email}</p>
            </>
          ) : (
            <p>ไม่มีข้อมูลส่วนตัวที่จะแสดง</p>
          )}

          {schedule.length > 0 ? (
            <>
              <h2>ตารางเรียน</h2>
              <ul>
                {schedule.map((item, index) => (
                  <li key={index}>
                    ปีการศึกษา: {item.academicYr}, ภาคการศึกษา: {item.semester}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>ไม่มีตารางเรียนที่จะแสดง</p>
          )}

          {announcements.length > 0 ? (
            <>
              <h2>ประกาศ</h2>
              <ul>
                {announcements.map((announce, index) => (
                  <li key={index}>
                    {announce.announce_message_th || "ไม่มีหัวข้อ"} - โดย{" "}
                    {announce.teachername}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>ไม่มีประกาศที่จะแสดง</p>
          )}

          {grades.length > 0 ? (
            <>
              <h2>เกรด</h2>
              {grades.map((semester, index) => (
                <div key={index}>
                  <h3>
                    ปีการศึกษา: {semester.academicYear}, GPA: {semester.gpa}
                  </h3>
                  <ul>
                    {semester.grade.map((course, idx) => (
                      <li key={idx}>
                        {course.subject_name_th} ({course.subject_code}): เกรด{" "}
                        {course.grade}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          ) : (
            <p>ไม่มีข้อมูลเกรดที่จะแสดง</p>
          )}

          {groupCourse.length > 0 ? (
            <>
              <h2>กลุ่มวิชา</h2>
              {groupCourse.map((group, index) => (
                <div key={index}>
                  <h3>ระยะเวลา: {group.peroid_date}</h3>
                  <ul>
                    {group.course.map((course, idx) => (
                      <li key={idx}>
                        วิชา: {course.subject_name_th} - อาจารย์:{" "}
                        {course.teacher_name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          ) : (
            <p>ไม่มีข้อมูลกลุ่มวิชาที่จะแสดง</p>
          )}

          {studentEducation && studentEducation.education ? (
            <>
              <h2>ข้อมูลการศึกษา</h2>
              {studentEducation.education.map((edu, index) => (
                <div key={index}>
                  <p>คณะ: {edu.facultyNameTh}</p>
                  <p>สาขา: {edu.majorNameTh}</p>
                </div>
              ))}
            </>
          ) : (
            <p>ไม่มีข้อมูลการศึกษาที่จะแสดง</p>
          )}

          {gpax ? (
            <>
              <h2>GPAX</h2>
              <p>GPAX: {gpax.gpax}</p>
              <p>จำนวนหน่วยกิตทั้งหมด: {gpax.total_credit}</p>
            </>
          ) : (
            <p>ไม่มีข้อมูล GPAX ที่จะแสดง</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
