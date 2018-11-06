const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const socketIO = require('socket.io')
//const io = socketIO(server)
const io = socketIO.listen(server)
let ids = []
let nodes_uuid = []
const port = 4001


verify = (arr , searched_value) => {
  return arr.findIndex(el=>{
    return el === searched_value
  })
}

io.on('connection', socket => {
  console.log('New client connected')
  socket.on('searchingPeer',({id , node_uuid })=>{
    console.log("id: ", id , "node_uuid: " , node_uuid )
    const verifIndex = verify(nodes_uuid,node_uuid)
    console.log("verifIndex",verifIndex) //must be -1
    if(verifIndex===-1){
      ///////////////////////////////////////////////
      ////////////hexagonal network/////////////////
      const null_restriction = verify(nodes_uuid,null)
      console.log("null_restriction: ",null_restriction)
      let lenIDS = ids.length
      console.log("lengIDS: ",lenIDS)
      let candidates = []
      if(null_restriction!==-1){
        nodes_uuid[null_restriction]=node_uuid
        ids[null_restriction]=id
        console.log("ids*: ", ids , "nodes_uuid*: " , nodes_uuid )
        lenIDS = null_restriction+1 -1//()null restriction+1 es la long de la cadena en donde
        //ira el nuevo elemento, -1 porque este sera usado para coger el candidato        
      }else{
        nodes_uuid.push(node_uuid)
        ids.push(id)
      }
      if(lenIDS>0 && lenIDS<6){
        candidates.push(ids[lenIDS-1])
      }else{
        if(lenIDS>0){
          candidates.push(ids[(lenIDS-6)+1 -1])
        }
      }
      ///////////////////////////////////////////////      
      //ids = [...r_ids,newId]//Object.assign({},r_ids,newId)//{...r_ids,newId}
      console.log("ids: ", ids)
      console.log("nodes_uuid: ", nodes_uuid)
      if(candidates.length>0){//if(Object.keys(candidates).length>0){
        console.log("candidate to send in searching peer: ", candidates[0])
        //socket.emit('newCandidate',candidates)
        socket.emit('newCandidate',{candidate_socket_id: candidates[0]})
      }
    }else{
      console.log("Error, node_uuid is in use!... ", node_uuid )}      
  })

  socket.on('receiveCandidate',(candidates,callback)=>{
    callback(candidates)
  })

  socket.on('initSendCandidates',data =>{
    const {peer_id} = data
    console.log(`Telling socket ${peer_id} callee be prepared...`)
    socket.broadcast.to(peer_id).emit('startCallee',{candidate_socket_id: socket.id})
  })

  socket.on('signal',({type,message,peer_id}) =>{
    //const peer_id_socket_index = verify(ids,socket.id)
    //const peer_id_socket = ids[peer_id_socket_index]
    console.log('message receive in signal: ', {type,message,peer_id} )    
    socket.broadcast.to(peer_id).emit('signaling_message',{
      type:type,
      message:message
      //candidate_socket_id: socket.id
    })
  })

  socket.on('xyz',(data,callback)=>{
    callback(data)
  })

  // disconnect is fired when a client leaves the server
  socket.on('disconnect', () => {
    console.log('user disconnected: ', socket.id)
    if(!(nodes_uuid.length === ids.length)){
      console.log("Error arrays don't match!!")
    }
    
    const idx_to_clean = verify(ids,socket.id)
    if(idx_to_clean===ids.length-1){
      ids.splice(idx_to_clean,1)
      nodes_uuid.splice(idx_to_clean,1)
    }else{
      ids[idx_to_clean]=null
      nodes_uuid[idx_to_clean]=null
    }

    if(ids.length>0){
      console.log("c1: ",ids[ids.length-1]==null && ids.length ==nodes_uuid.length )
      while(ids[ids.length-1]==null && ids.length ==nodes_uuid.length ){
        ids.splice(ids.length-1,1)
        nodes_uuid.splice(nodes_uuid.length-1,1)
        if(ids.length==0) break;
      }
    }
    if(ids.length>0){
      console.log("c2: ",ids[0]==null && ids.length ==nodes_uuid.length)
      while(ids[0]==null && ids.length ==nodes_uuid.length ){
        ids.splice(0,1)
        nodes_uuid.splice(0,1)
        //ids.shift()
        //nodes_uuid.shift()
        if(ids.length==0) break;
      }
    }
    
    console.log("final ids", ids)
    console.log("final nodes_uuids",nodes_uuid)
      
  })
})

server.listen(port, () => console.log(`Listening on port ${port}`))