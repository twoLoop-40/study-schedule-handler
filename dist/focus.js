// course의 정보를 모으는 함수를 객체로 모으기
const Course = {
  // workType
  setWorkType() {
    const workType = "ASSIGNMENT"
    this.template = { ...this.template, workType }
    return this
  },
  // assigneeMode
  setAssigneeMode() {
    const assigneeMode = "INDIVIDUAL_STUDENTS"
    this.template = { ...this.template, assigneeMode }
    return this
  },
  // state
  setState () {
    const state = "PUBLISHED"
    this.template = { ...this.template, state }
    return this
  },
  // individualStudentsOptions
  setIndividualStudentsOptions ({ userName = '' } = {}) {
    const studentList = function () {
    return Classroom.Courses.Students.list(location.courseId)
    }
  // fullName -> [studentId]
    const getStudentId = function (){
      return studentList()
        .students
        .map(student => student.profile)
        .filter(profile => profile.name.fullName === userName)
        .map(filteredProfile => filteredProfile.id)
    }
    const individualStudentsOptions = {}
    individualStudentsOptions.studentIds = getStudentId()
    this.template = { ...this.template, individualStudentsOptions }
    return this
  },
  // studentId check 
  checkStudentId () {
    // studentId 있는 지 확인
    const template = this.template
    if(!template.individualStudentsOptions) {
      console.log('1')
      return false
    } else if (!template.individualStudentsOptions.studentIds) {
      console.log('2')
      return false
    } else if (template.individualStudentsOptions.studentIds.length <= 0) {
      console.log('3')
      return false
    } else {
      console.log('student Id 검사 통과')
      return true
    }  
  },
  setTopic ({ userName = '' } = {}) {
    // make topic for new comer
    // { userName } = userInfo -> topicId
    const checkTopicId = function (topicName) {
      const topicList = Classroom.Courses.Topics.list(location.courseId).topic
      const topics = topicList.filter(topic => topic.name === topicName)
      if (topics.length > 0) {
        return topics[0].topicId
      }
    }  
    const makeTopicForNewStudent = function () {
      const userInfo = { name: userName + ' ' + '학생' }
      const topicId = checkTopicId(userInfo.name)
      if (topicId) {
        return topicId
      } else {
        const topic = Classroom.Courses.Topics.create(userInfo, location.courseId)
        return topic.topicId
      }  
    }
    const topicId = makeTopicForNewStudent()
    this.template = { ...this.template, topicId }
    return this   
  },
  setDescription ({ userName = '', userCode = ''}) {
    const description = `${userName} 학생
    기관코드: 1191, 사용자코드: ${userCode}
    시험코드는 시험지에 있습니다. 슈퍼클리닉 포커스를 이용하여 여러분의 실력과 취약점에 맞는 수학 공부가 되도록 하겠습니다. 
    문제를 다 푼 다음에 아래 링크를 클릭하고 제출하면 해설지와 그 다음 시험지가 나오니 열심해 해주세요 화이팅!`
    this.template = { ...this.template, description }
    return this  
  },
  setMaterial () {
    const materials = []
    materials[0] = { "link": { url: location.answerLink} }
    this.template = { ...this.template, materials }
    return this
  },
  // title 만들기
  setTitle ({ userName = '' } = {}) {
    const makeDateForToday = () => {
      const today = new Date()
      const [year, month, date] = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
      return [year, month, date].join('-');
    };
    const title = `${makeDateForToday()} ${userName} 학생 슈퍼클리닉 포커스 입니다.`
    this.template = { ...this.template, title }
    return this
  },
  makeCourseWork () {
    Classroom.Courses.CourseWork.create(this.template, location.courseId)
  }  
}
// courseWork obj 만들기
const makeCourseTemplate = function (userInfo = {}) {
  const courseTemplate = Object.create(Course)
  courseTemplate.template = {}
  courseTemplate
    .setWorkType()
    .setAssigneeMode()
    .setState()
    .setMaterial()
    .setTitle(userInfo)
    .setTopic(userInfo)
    .setIndividualStudentsOptions(userInfo)
    .setDescription(userInfo)  
  console.log(courseTemplate.template)
  return courseTemplate
}
// courseWork 만들기
const makeCourseWork = function (userInfo = {}) {
  const courseTemplate = makeCourseTemplate(userInfo)
  if(courseTemplate.checkStudentId()) {
    console.log('학생 아이디 있음')
    try{
      courseTemplate.makeCourseWork()
      return `${userInfo.userName}을 위한 첫번째 클래스룸을 개설하였습니다.`
    } catch (err) {
      console.error(err)
      return err
    }
  } 
  else return `${userInfo.userName}이 아직 클래스룸에 입장하지 않았습니다.`
}

// test
const testClassroom = function () {
  //courseForJs.studentsId = courseForJs.studentList()
  //courseForJs.studentsId.students.map(student => console.log(student.profile))
  //console.log(courseForJs.getStudentId('박성은'))
  //Course.setTitle()
  // const userInfo = { userName: '김동환', userCode: '81003' }
  // makeCourseWork(userInfo)
  const topicList = Classroom.Courses.Topics.list(location.courseId)
  console.log(topicList)
}
