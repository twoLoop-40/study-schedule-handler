type SheetData = number | string

function getStudentsInformation <T extends SheetData> () {
	const StudentSheeId = '1U-xZUmA48YiSS1QWs93qu7PZaxSsGvALukQ00UAyLBw'
	const sheetName = 'Student Form'
	const table = SpreadsheetApp
		.openById(StudentSheeId)
		.getSheetByName(sheetName)
		?.getDataRange()
		.getValues()
	
	const tableCut = !table 
		? null
		: table.length > 1
		? table.slice(1)
		: table
	
	return tableCut?.map((studentData: T[]) => Student.of(studentData))
}
 
class Student <T extends SheetData> {
	static of <T extends SheetData> (studentData: T[]) {
		return new Student(studentData)
	}
	typeToString (item: T) {
		return typeof item != 'string' ? item.toString() : item
	}
	getUserCode () {
		return this.sheetData ? this.typeToString(this.sheetData[0]) : ""
	}
	getUserName () {
		return this.sheetData ? this.typeToString(this.sheetData[1]) : ""
	}
	getStudentId () {
		return this.sheetData ? this.typeToString(this.sheetData[5]) : ""
	}
	getTopicId () {
		return this.sheetData ? this.typeToString(this.sheetData[6]) : ""
	}
	getClassroomId () {
		return this.sheetData ? this.typeToString(this.sheetData[9]) : ""
	}
	getEmailAddress() {
		return this.sheetData ? this.typeToString(this.sheetData[4]) : ""
	}
	constructor(
		public sheetData: T[] 
	) {}
}

function testStudentInformation () {
	getStudentsInformation()?.forEach((student: Student<SheetData>) => console.log(student.getUserName()))
}