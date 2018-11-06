import React, { Component } from 'react'
import io from 'socket.io-client'
import DB from './DB'

import NewPeer from './wrtconf/NewPeer';

const endpoint = "http://localhost:4001" // this is where we are connecting to with sockets
class App extends Component {
    state = {
      db:new DB('blockchain1'),
      //socket:io(endpoint),
      socket:io.connect(endpoint),
      otherNodes_id:[],
      flag:true,
      cPc:[]
    }

  componentWillMount() {
    const {socket} =this.state
    socket.on('connect', ()=>{
      console.log("triggered socket.id: ",socket.id)
    })
  }

  componentDidMount() {
    const {socket} = this.state
    
    socket.on('startCallee', data => {
    console.log("receiving call from peer: ", data.candidate_socket_id)
    socket.emit('xyz',
    data,this.becomeCallee)})
  

    socket.on('newCandidate', candidates => socket.emit('receiveCandidate',
    candidates,this.receiveCandidateHandler))
  }

  
  receiveCandidateHandler = (data) => {
    new Promise((resolve,reject)=>{
      resolve(this.signalingMessageHandler(data))
      reject("Error in receiveCandidateHandler")
    }).then(i=>this.state.cPc[i].callAction()).catch(e=>console.log(`Error in receive signalingMessageHandler: ${e}`))
  }

  becomeCallee = (data) => {
    new Promise((resolve,reject)=>{
      resolve(this.signalingMessageHandler(data))
      reject("Error in becomeCallee")
    }).then(i=>this.state.cPc[i].callee())
    .catch(e=>console.log(`Error in receive signalingMessageHandler: ${e}`))
  }

  signalingMessageHandler = (data) => {
    console.log("candidate received",data)
    console.log("signalingMessageHandler en App.js")
    const {candidate_socket_id} = data
    if(candidate_socket_id){
      let otherNodes_id = [...this.state.otherNodes_id]
      otherNodes_id.push(candidate_socket_id)
      const i = otherNodes_id.length - 1      
      const {socket} = this.state
      let pc = new NewPeer({socket:socket , peer_id:candidate_socket_id})
      let cPc = [...this.state.cPc]
      cPc.push(pc)
      this.setState({otherNodes_id,cPc})
      console.log("indice i", i)
      return i
    }
  }

  connect = () => {
    const {socket} = this.state
    socket.emit('searchingPeer',{'id':socket.id,'node_uuid':this.state.node_uuid})
  }

  showUUID = async () => {
    let node_uuid = this.state.db.createUUID()
    let msg = null
    await this.state.db.getUUID().then(r=>{
      if(r==='not_found'){
        console.log('creando uuid...')
        const fcn_uuid = async()=>{await this.state.db.saveUUID(node_uuid)}
        fcn_uuid(node_uuid)
        console.log('uuid',node_uuid)
        msg='uuid created!... : '
      }else{
        node_uuid = r
        msg='uuid catched!... : '
      }
      this.setState({node_uuid},()=>console.log(msg , node_uuid))
    })
  }

  connect_peer = () =>{
    if(this.state.otherNodes_id.length>0){
      //console.log(this.state.cPc[0].render())
      let i = 0
      this.state.cPc.forEach(pc =>{        
        return this.state.cPc[i].render()})
        i++
    }
  }


  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <button id="blue" onClick={() => this.connect()}>connect</button>
        <button onClick={() => this.showUUID()}>showUUID</button>
        <h2>{this.state.node_uuid}</h2>
        <div>{this.connect_peer()}</div>
      </div>
    )
  }
}

export default App