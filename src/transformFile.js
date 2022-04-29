// function fileToData64 () {
//    const loadFileFromId = function (fileId) {
//      return DriveApp.getFileById(fileId)
//    }
//    const changeFileToBytes = function (file) {
//      return file.getBlob().getBytes()
//    }
//    const encode64 = function (bytes) {
//      return Utilities.base64Encode(bytes)
//    }
//    const getMimeType = function (file) {
//      return file.getMimeType()
//    }
//    const makeSrc = function ({ mimeType, data64}) {
//      return `data:${mimeType};base64,${data64}`
//    }

//   return async fileData => {
//     const p = new Promise((resolve, reject) => {
//       console.log(typeof fileData)
//       if(typeof fileData === 'string') resolve(fileData)
//       else reject(fileData)
//     })
//     const result = await p.then(loadFileFromId)
//     .catch(fileData => fileData)
//     .then(fileData => {
//       const bytes = changeFileToBytes(fileData)
//       return { fileData, bytes }
//     })
//     .then(data => {
//       const { fileData, bytes } = data
//       const data64 = encode64(bytes)
//       return { fileData, data64 }
//     })
//     .then(data => {
//       const { fileData, data64 } = data
//       const mimeType = getMimeType(fileData)
//       return { data64, mimeType }
//     })
//     .then(data => makeSrc(data))
//     .catch(err => {
//       console.error(err)
//       return null
//     })

//     if(result) return result
//   }
// }

// function fileDataToClient (fileId) {
//   const worker = fileToData64()
//   return worker(fileId)
// }

// async function testFileData () {
//   console.log(await fileDataToClient('13NTbxFA3eQDBxbz9ksx41vQd7M1swL5G'))
// }
