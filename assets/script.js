import Component from '../../../../bin/parents/component.js';


import Plib from '../../../../services/Plib.js';
import PickleTable  from '../../../../assets/table/pickletable.js';
import PickleContext  from '../../../../assets/context/picklecontext.js';


export default class Socials extends Component{
    
    async render(){
        this.styles = [
            'views/pages/Settings/Socials/component.css?v='+(new Date).getTime(),
            'assets/table/pickletable.css?v='+(new Date).getTime(),
            'assets/table/theme.css?v='+(new Date).getTime(),
            'assets/context/picklecontext.css?v='+(new Date).getTime()
        ];

        await this.view(`<div class="card fluid shadow">
                                        <div class="section head_section">
                                            <h4>Social Types</h4>
                                            <button type="button" class="secondary ripple" id="btn_add_social">
                                                <i class="fa fa-plus"></i>
                                            </button>
                                        </div>
                                        <div class="section" style="height:80vh" id="div_table">
                                            <div class="row">
                                                <div class="col-sm-12" style="padding-bottom: 5px;">
                                                    <input style="width:100%" type="text" id="in_tbl" placeholder="Search :"/>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-sm-12" style="height: 70vh;">
                                                    <div id="tbl_social"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`);
    }


    async afterRender(){
        await this.build();
        await this.events();
        if(this.renderCallback !== null) this.renderCallback(this.referance);
    }

    async build(){
        this.container = {};
        this.plib = new Plib();
        //build table
        this.getTypes();
    }


    async events(){
        //listen add event
        document.getElementById('btn_add_social').addEventListener('click',()=>this.getCForm());

        //listen table seearch
        document.getElementById('in_tbl').addEventListener('keyup',e=>{
            this.table.setFilter(
                [{
                    key:'all',
                    type:'like',
                    value:e.target.value.trim()
                }]
             );
        });
    }


    /**
     * this method will get categories from api
     */
    async getTypes(){
        const headers = [
            {
                title:'Title',
                key:'title',
                width:'50%',
                order:true,
                type:'string', // if column is number then make type number
                columnFormatter:(elm,rowData,columnData)=>{
                    //this method will manuplate column content
                    //console.log(elm,rowData);
                    return columnData+'_formattedd..';
                },
            },
            {
                title:'#',
                key:'id',
                width:'10%',
                headAlign:'center',
                colAlign:'center',
                columnFormatter:(elm,rowData,columnData)=>{
                    elm.classList.add('btn_context');
                    elm.dataset.id = columnData;//give to id 
                    //this method will manuplate column content
                    //console.log(elm,rowData);
                    return '<i class="fa fa-list" style="pointer-events:none;"></i>';
                },
            },
            
        ]

        this.table = new PickleTable({
            container:'#tbl_social',
            headers:headers,
            type:'ajax',
            ajax:{
                url: '/src/passage.php?job=data&event=getTable&model=sys_social_types',
                pageLimit:10,
                data:{
                    //order:{},
                }
            },
        });

        //table menu
        new PickleContext({
            //target
            c_target: 'btn_context',
            //nodes
            c_nodes: [{
                icon: 'fa fa-edit',
                title: 'Edit',
                //context button click event
                onClick: (node) => {
                    this.getCForm('update',this.table.getRow(node.dataset.id));
                }
            }, {
                icon: 'fa fa-trash',
                title: 'Delete',
                onClick: async (node) => {
                    this.plib.setLoader('#div_table');
                    await this.plib.request({
                        method:'POST',
                        url: '/src/passage.php?job=event',
                        data:{
                            event : 'delete',
                            model: 'sys_social_types',
                            data: JSON.stringify({
                                id:node.dataset.id
                            })
                        }
                    }).then(rsp=>{
                        if(rsp.rsp){
                            this.table.deleteRow(node.dataset.id);
                            this.plib.toast('error','Type Removed !!');
                        }else{
                            this.plib.toast('error','Error Happend !!');
                        }
                    });
                    this.plib.setLoader('#div_table',false);
                }
            }]
        });
    }

    /**
     * this method will get category form for transaction
     * @param {string} type    
     * @param {integer} parent_id 
     * @param {integer} id 
     */
    async getCForm(type="add",data={id:0}){
        Swal.fire({
            icon: 'warning',
            title: 'Enter Info',
            html:`  <div class="row">
                        <div class="col-md-12 input-group vertical text-center">
                            <label>Title *</label>
                            <input required class="elm_stypes" type="text" value="" name="title" placeholder="Title"/>
                        </div>
                        <div class="col-md-12 input-group vertical text-center">
                            <label>Icon</label>
                            <select name="icon" id="sel_icon" class="fa fas elm_stypes">
                                <option value="">Select Icon</option>
                                <option class="fas" value="fas fa-laptop">&#xf109; Computers</option>
                                <option class="fa" value="fa fa-building">&#xf1ad; Buildings</option>
                            </select>
                        </div>
                    </div>
                    <br>`,
            showCancelButton:true,
            confirmButtonText:'Save !',
            showLoaderOnConfirm: true,
            allowOutsideClick: () => !Swal.isLoading(),
            willOpen:()=>{
                if(Object.keys(data).length !== 0){
                    for(let key in data){
                        const elm = document.querySelector('.elm_stypes[name="'+key+'"]');
                        if(elm !== null) elm.value = data[key];
                    }
                }
            },
            preConfirm:async ()=>{
                const model = this.plib.checkForm('.elm_stypes');
                if(model.valid){
                    //set parent id and main id
                    model.obj.id = data.id;
                    //send data to api
                    await this.plib.request({
                        method:'POST',
                        url: '/src/passage.php?job=event',
                        data:{
                            event : data.id === 0 ? 'add' : 'update',
                            model: 'sys_social_types',
                            data: JSON.stringify(model.obj)
                        }
                    }).then(rsp=>{
                        if(rsp.rsp){
                            if(type!=='add') model.obj.id = data.id;
                            this.container[rsp.data.id] = model.obj;
                            this.plib.toast('success','Type '+type === 'add' ? 'Added' : 'Updated'+' ..');
                            //manage table 
                            if(type === 'add'){
                                //add new table element
                                this.table.addRow(model.obj);
                            }else{
                                //update table element
                                this.table.updateRow(model.obj.id,model.obj);
                            }
                        }else{
                            this.plib.toast('error','Error Happend !!');
                        }
                    });
                }else{
                    swal.showValidationMessage(
                        'Please enter required fields.'
                    );
                    return false;
                }
            }
        });
    }   

}

