import PouchDB from 'pouchdb'
import { v1 } from 'uuid';

export default class DB {
    constructor(name){
        this.db = new PouchDB(name)
    }

    getUUID = async () => {
        let node_uuid 
        await this.db.get('my_UUID').then(result => node_uuid = result.value ).catch(e => node_uuid = e.name)        
        return node_uuid
    }

    createUUID = () =>{
        return v1()
    }

    saveUUID = async (my_UUID) => {
        await this.db.put({_id:'my_UUID',value:my_UUID}).then(r=>{return my_UUID})
        .catch(e=>console.log('Error saving id: ', e.name ))
    }
    
}