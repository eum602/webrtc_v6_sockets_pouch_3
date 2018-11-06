import React , {Component} from 'react'
let icesReq = []
let socket = null
let peer_id = null
let told = false
let rtcPeerConn = []
let sendDataChannel = []
let catchDataChannel = []
let ices = []

export default class NewPeer extends Component {    

    state = {
        fileBuffer : [],
        fileSize : []
    }

    will() {
        socket = this.props.socket
        peer_id = this.props.peer_id
        console.log("Entrando a component will mount...socket: ", this.props)
    }

    did() {
        socket.on('signaling_message',(data) => socket.emit('xyz',
        data,this.signalingMessageHandler))

        window.onbeforeunload = function() {
            socket.emit('signal',{"type":"endCall","message":"finishing call","peer_id":peer_id})
        };
    }

    callee = () => {
        this.will()
        this.did()
    }

    callAction = () => {
        console.log('socket:',socket)
        this.will()
        this.did()
        //peer_id = this.props.peer_id
        if(!told){
            told =true
            socket.emit('initSendCandidates',{message:"start","peer_id":peer_id})
        }
        
        //sendFile.disabled = true
        console.log('Starting operation call.')
        //let i = null
        console.log(0, this.state)
        new Promise((resolve,reject) => {
                //this.setState({i,rtcPeerConn,sendDataChannel,catchDataChannel})
                resolve(this.createPC())
                reject('error...')
            }).then(i =>{
                //console.log('state data after create: ' , this.state)
                console.log('data after createPC function: ',i)                
                console.log("i after createPc fcn",i)
                if(i>=0){
                    return new Promise((resolve,reject)=>{
                        resolve(this.setPC(i))
                        reject('Error on setPC...')
                    }).then(result => {
                        //displaySignalMessage('peerConnection createOffer start.')
                        //let [rtcPeerConn,sendDataChannel] = result
                        console.log('peerConnection createOffer start.')
                        rtcPeerConn[i].createOffer()
                        .then(e => this.createdOffer(e,i)).catch(this.setSessionDescriptionError)
                    })
                }else{
                    return new Promise((resolve,reject)=>{                        
                        reject('Error on nowhere...')
                    })

                }
            }).then(result =>{    
                //let [rtcPeerConn,sendDataChannel] = result
                console.log(result)

            }).catch(e=>console.log(e))       
        
    }

    createPC = () => {
        //let {rtcPeerConn,sendDataChannel,catchDataChannel} = this.state
        //let rtcPeerConn1 = [...this.state.rtcPeerConn]        
        //let sendDataChannel1 = [...this.state.sendDataChannel]
        //let catchDataChannel1 = [...this.state.catchDataChannel]
        console.log("rtcPeerConn1: ",rtcPeerConn)
        const i = rtcPeerConn.length
        console.log('is',i)
        const initiator = null
        rtcPeerConn.push(initiator)
        sendDataChannel.push(initiator)
        catchDataChannel.push(initiator)

        return i
    }

    setPC = (i) => {
        //let [i,rtcPeerConn,sendDataChannel,catchDataChannel] = [...result]
        //let {i,rtcPeerConn,sendDataChannel,catchDataChannel} = this.state
        const servers = {
            'iceServers':[//{
                //'url':'stun:stun.l.google.com:19302'
            //},{'url': 'stun:stun.services.mozilla.com'}
            {'url':'turn:kaydee@159.65.151.221','credential':'userdeepak','username':'kaydee'}
        ]
        }
        const dataChannelOptions = {
            ordered: true//false, //not guaranteed delivery, unreliable but faster
            //maxRetransmitTime:  1000 //miliseconds
        }
        //callButton.disabled = true;
        //hangupButton.disabled = false;
        console.log(`Received data in setPC:rtcPeerConn[${i}]-> ${rtcPeerConn[i]}`)
        rtcPeerConn[i] = new window.webkitRTCPeerConnection(servers)
        console.log('Created local peer connection object rtcPeerConn index: ' + i )
        const name = 'textMessages' + i
        sendDataChannel[i] = rtcPeerConn[i].createDataChannel(name,dataChannelOptions)    
        rtcPeerConn[i].ondatachannel = e=>this.receiveDataChannel(e,i)
        rtcPeerConn[i].addEventListener('icecandidate', this.handleConnection)
        rtcPeerConn[i].addEventListener(
        'iceconnectionstatechange', this.handleConnectionChange)

        return [rtcPeerConn,sendDataChannel]
    }
    
    
    receiveDataChannel = (event,i)=>{
        console.log("Receiving a data channel")
        catchDataChannel[i] = event.channel;//seteando el canal de datos a ser el que el   
        catchDataChannel[i].onmessage = e=>this.receiveDataChannelMessage(e,i);
        catchDataChannel[i].onopen = e=>this.dataChannelStateChanged(e,i,catchDataChannel);
        catchDataChannel[i].onclose = e => this.dataChannelStateChanged(e,i,catchDataChannel);
        //return catchDataChannel;
        //this.setState({catchDataChannel})
    }
    
    receiveDataChannelMessage = (event, i) => {
        let fileBuffer = [...this.state.fileBuffer]
        fileBuffer.push(event.data) //pushing each chunk of the incoming file
        //into fileBuffer
        let fileSize = this.state.fileSize
        let receivedFileSize = this.state.receivedFileSize
        fileSize += event.data.byteLength //updating the size of the file    
        //fileProgress.value = fileSize  //------------------------>>>
        if(fileSize === receivedFileSize){
            //var received = new window.Blob(fileBuffer)
            fileBuffer = []
            //displaySignalMessage("clearing fileBuffer..." + "length buffer = "+fileBuffer.length)
            console.log("clearing fileBuffer...length buffer = " + fileBuffer.length)
            //displaySignalMessage("all done... data received")
            console.log("all done... data received")
            //downloadLink.href = URL.createObjectURL(received)//finally when all is received
            //the peer will get the link to download de file
            //downloadLink.download = receivedFileName
            //removeAllChildItems(downloadLink)
            //downloadLink.appendChild(document.createTextNode(receivedFileName + "(" + 
            //fileSize + ") bytes" ))
            //displaySignalMessage("Received... " + fileSize + "/" + receivedFileSize )
            console.log("Received... " + fileSize + "/" + receivedFileSize)
            fileSize = 0
            receivedFileSize = 0
            this.setState({fileSize,receivedFileSize,fileBuffer})
        }else{
            this.setState({fileSize,receivedFileSize,fileBuffer})
        }
    }

    dataChannelStateChanged(e,i,catchDataChannel){
        if(catchDataChannel[i]!==null){
            if(catchDataChannel[i].readyState === 'open'){//si el readyState es abierto
                //displaySignalMessage("Data Channel Opened")
                console.log("Data Channel Opened")
            }else{
                //displaySignalMessage("data channel is : " + catchDataChannel[i].readyState)
                console.log("data channel is : " + catchDataChannel[i].readyState)
            }
        }
    }

    handleConnection(event) {
        const iceCandidate = event.candidate;
        if(iceCandidate){
            //console.log('state data after create.....: ' , this.state)
            //let icesReq = [...this.state.icesReq]
            icesReq.push(iceCandidate)
            //this.setState({icesReq})
        }
        //else if (!iceCandidate && this.state.icesReq.length>0) {
        else if (!iceCandidate && icesReq.length>0) {           
            console.log("icesReq: ",icesReq)
            //const {socket} = this.props
            //let len = this.state.icesReq.length
            let len = icesReq.length
            let iter = 0
            //displaySignalMessage("ICE protocol gathered " + len + " candidates.." )
            console.log("ICE protocol gathered " + len + " candidates..")
            let newIceCandidate
            //let icesReq = [...this.state.icesReq]
            icesReq.forEach(iceCandidate=>{
                iter++
                newIceCandidate = iceCandidate
                console.log("candidate created ready to be sent: ", newIceCandidate)
                socket.emit('signal',{
                    "type":"ice candidate",
                    "message":JSON.stringify({'candidate':newIceCandidate}),
                    //"room":SIGNAL_ROOM
                    "peer_id":peer_id
                })
                //displaySignalMessage( iter +". Sending Ice candidate ...");
                console.log(`${iter} . Sending Ice candidate al peer ${peer_id}`)
            })
            socket.emit('signal',{
                "type":"noIce",
                "message":"",
                //"room":SIGNAL_ROOM})
                "peer_id":peer_id
            })
                console.log(`ending noIce signal to peer ${peer_id}`)
            //icesReq = []
        }//else if(!iceCandidate && this.state.icesReq.length==0){
            else if(!iceCandidate && icesReq.length===0){
            //displaySignalMessage("Candidate received is null, no candidates received yet, check your code!..")
            console.log("Candidate received is null, no candidates received yet, check your code!..")
        }
    }

    setSessionDescriptionError = (error) => {
        //displaySignalMessage(`Failed to create session description: ${error.toString()}.`);
        console.log(`Failed to create session description: ${error.toString()}.`);
    }

    handleConnectionChange = (event) => {
        const peerConnection = event.target;
        console.log('ICE state change event: ', event);
        if(peerConnection.iceConnectionState === "connected"); //sendFile.disabled = false;
        //displaySignalMessage(`ICE state: ` +
        //        `${peerConnection.iceConnectionState}.`);
        console.log(`ICE state: ` +
                `${peerConnection.iceConnectionState}.`)
    }
    
    createdOffer = (description , i) => {
        console.log('offer from this local peer connection: ',description.sdp)
        //displaySignalMessage('localPeerConnection setLocalDescription start.');
        console.log('localPeerConnection setLocalDescription start.');
        rtcPeerConn[i].setLocalDescription(description)
        .then(() => {
        this.setLocalDescriptionSuccess(i);
        console.log('Local description created: ',rtcPeerConn[i].localDescription)
        //displaySignalMessage("Local description created..")
        console.log("Local description created..")
        this.sendLocalDesc(rtcPeerConn[i].localDescription)
        }).catch(this.setSessionDescriptionError);
    }

    setLocalDescriptionSuccess = (i) => {
        this.setDescriptionSuccess(`setLocalDescription number ${i}`);
    }

    setDescriptionSuccess = (functionName) => {
        //displaySignalMessage(`${functionName} complete.`);
        console.log(`${functionName} complete.`)
    }

    sendLocalDesc = (desc) => {    
        //const {socket} = this.props
        console.log("sending local description",desc)
        try{
            //displaySignalMessage("16. Sending Local description");
            console.log("16. Sending Local description")
            var sdp = {
                type:"SDP",
                message:JSON.stringify({'sdp':desc}),              
                //room:SIGNAL_ROOM
                peer_id:peer_id
            }
            console.log("sdp sent to other nodes in sendLocalDescription: ",sdp)
            socket.emit('signal',sdp);
        }catch(e){
            this.logError1(e,"sending local description");
        }
    }

    setSessionDescriptionError = error => {
        //displaySignalMessage(`Failed to create session description: ${error.toString()}.`);
        console.log(`Failed to create session description: ${error.toString()}.`);
    }

    logError1 = (error,where) => {
        //displaySignalMessage("problems in " + where +" "+ error.name + ': ' + error.message );
        console.log("problems in " + where +" "+ error.name + ': ' + error.message )
    }

    determineI = () => {
        let i = 0    
        return i
    }

    signalingMessageHandler = async (data)=>{
        console.log('data recibida en signalingMessageHandler ',data)
        let i = this.determineI()
        console.log("data",data)
        //displaySignalMessage("data type: " + data.type)
        if (!rtcPeerConn[i]) this.setPC(i);
        try {
            if (data.type==="SDP") {
                var a = JSON.parse(data.message)
                var desc = a.sdp
                console.log("desc: ",desc)
                var c = desc.type          
                //displaySignalMessage('working on sdp type ' + c)
                console.log('working on sdp type ' + c)
                // if we get an offer, we need to reply with an answer
                if (c === 'offer') {
                    //displaySignalMessage("Entering to define an answer because of offer input..")
                    console.log("Entering to define an answer because of offer input..")
                    await rtcPeerConn[i].setRemoteDescription(desc).then(r=>{
                        //displaySignalMessage("Remote description stored")
                        console.log("Remote description stored")
                    }).catch(e=>{
                        //displaySignalMessage('error setting remote description ' + e.name)
                        console.log("Error setting remote description: ", e)
                    });
                    await rtcPeerConn[i].setLocalDescription(await rtcPeerConn[i].createAnswer()).then(r=>{
                        //displaySignalMessage("Created Local description")
                        console.log("Created Local description")
                    }).catch(e=>{
                        //displaySignalMessage("Error setting local description when receiving an offer: " + 
                        //e.name)
                        console.log("Error setting local description when receiving an offer: " + e.name)
                    });
                    console.log('local description-answer: ',rtcPeerConn[i].localDescription)
                    this.sendLocalDesc(rtcPeerConn[i].localDescription)
                } else if (c === 'answer') {
                    //displaySignalMessage("Entering to store the answer remote description..")
                    console.log("Entering to store the answer remote description..")
                    await rtcPeerConn[i].setRemoteDescription(desc).then(r=>{
                        //displaySignalMessage("Remote answer stored")
                        console.log("Remote answer stored :",rtcPeerConn[i].remoteDescription)                            
                    }).catch(e=>{
                    //displaySignalMessage('error setting remote descrition: '+ e.name)
                    console.log('error setting remote descrition: ', e)
                    });                     
                } else {
                    console.log('Unsupported SDP type.');
                }
            } else if (data.type === "ice candidate") {
                //displaySignalMessage("Adding foreign Ice candidate..")
                console.log("Adding foreign Ice candidate..")
                var m = JSON.parse(data.message)
                const ice = m.candidate
                console.log('ice candidate: ',ice)                
                ices.push(ice)
            } else if(ices.length>0 && data.type ==="noIce"){                    
                    ices.forEach(ice=>{
                        rtcPeerConn[i].addIceCandidate(ice).then(r=>{
                            //displaySignalMessage('added a foreign candidate')
                            console.log('added a foreign candidate')
                        }).catch(e => {
                        //displaySignalMessage("3. Failure during addIceCandidate(): " + e.name)
                        console.log('error adding iceCandidate: ', e)
                        })
                    })
                }
            else if(data.type ==="endCall"){
                rtcPeerConn[i].close()
                if(sendDataChannel[i]){
                    sendDataChannel[i].close()
                    sendDataChannel[i] = null
                }
                if(catchDataChannel[i]){
                    catchDataChannel[i].close()
                    catchDataChannel[i] = null
                }
                rtcPeerConn[i] = null;
                //sendFile.disabled = true
                icesReq = []
                //hangupButton.disabled = true;
                //callButton.disabled = false;
            }
        } catch (err) {
            //displaySignalMessage("error on signaling message: " + err.name);
            console.log("error on signaling message: " , err)
        }
    }

    render() {
        
        return(
            <div>
                <button onClick = {this.callAction}>start Call</button>                
            </div>
        )
    }    
}