// HTML 읽는 함수
const getHtmlContent = function (method ='') {
  return ({ fileName = '', size = {} }) => {
    const htmlObj = HtmlService.createTemplateFromFile(fileName)
    const html = htmlObj.evaluate()
    
    if (Object.keys(size).length !== 0) {
      html
        .setWidth(size.width)
        .setHeight(size.height)   
    }
    if (method) {
      console.log(method)
      return html[method]()
    }
    return html
  }
}
// htmlcontent에서 content만 뽑아서 쓰기
const loadView = function ({ fileName = ''} = {}) {
  const htmlContent = getHtmlContent('getContent')
  return htmlContent({ fileName })  
}

// content 뽑는 함수로 이름만 바꿈
const loadContent = function (fileName = '') {
  const htmlContent = getHtmlContent('getContent')
  return htmlContent({ fileName })
}

