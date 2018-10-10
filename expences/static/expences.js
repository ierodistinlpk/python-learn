// -*- encoding:utf-8-*-
//to onload. fill lists and default values. check record id in request. 
function load(){
    ajaxRequest('GET','/exp/init',function(a,b,c){loadHandler(a,b,c)});
}

function loadHandler(respdata,textStatus,jqXHR){
    let data=JSON.parse(respdata);
    ReactDOM.render(React.createElement(Area, { data:null,lists:data.lists,settings:data.settings, name: 'Expences' }),document.getElementById('area'));
}

function ajaxRequest(method,url,processor,params) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
		processor(xmlhttp.responseText);
	    }
            else {
		console.log('something else other than 200 was returned.'+xmlhttp.status );
            }
        }
    };
    xmlhttp.open(method, url, true);
    if (method=='POST'){
	xmlhttp.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
    }
    xmlhttp.send(params);
}
function getCookie(name){
    let h={};
    let cookie=document.cookie.split('; ').map((item)=>{
	let pair=item.split('=');
	h[pair[0]]=pair[1];
	return pair; });
    return h[name];
}

class EditForm extends React.Component{
    constructor(props) {
	super(props);
	console.log(props);
	this.state = Object.assign({},props.data);
	if (props.settings){
	    this.state['is_expence']=true;
	    this.state['is_approx']=false;
	    for (var i=0;i<props.lists.length;i++){
		this.state[props.lists[i].name]=props.settings[props.lists[i].name];
	    }
	}
	this.handleChange = this.handleChange.bind(this);
	this.handleSubmit = this.handleSubmit.bind(this);
	
    }
    
    handleChange(event) {
	if (event.target.name!='id')
	    this.setState({[event.target.name]: event.target.value});
    }
    handleCheckbox(event) {
	    this.setState({[event.target.name]: event.target.checked});
    }
    
    handleSubmit(event) {
	event.preventDefault();
	this.props.saveClick(this.state);
    }
    render(){
	var res=[];
        var keys = Object.keys(this.props.data);
	let lists={};
	for (var i=0;i<this.props.lists.length;i++){
	    lists[this.props.lists[i].name]=this.props.lists[i].values;
	}
	for (var i = 0; i < keys.length; i++) {
	    let field = null;
	    if (Object.keys(lists).indexOf(keys[i])!=-1){
		let options=[];
		for (var j=0;j<lists[keys[i]].length;j++){
		    options.push(React.createElement('option',{key:lists[keys[i]][j]},lists[keys[i]][j]));
		}
		field =  React.createElement('select',{name: keys[i], type:'text', value:this.state[keys[i]], onChange:this.handleChange},options)
	    }
	    else 
	    {
		if (keys[i].substr(0,3)=='is_')
		    field =  React.createElement('input',{name: keys[i], type:'checkbox', checked:this.state[keys[i]], onChange:(e)=>this.handleCheckbox(e)})		
		else{
		    let fieldtype=(keys[i]=='exptime')?'date':'text';	
		    field =  React.createElement('input',{name: keys[i], type:fieldtype, value:this.state[keys[i]], onChange:this.handleChange,'data-date-format':"YYYY-DD-MM"})
		}
	    }
            res.push(React.createElement('tr', { name: keys[i], key: keys[i] },
					 React.createElement('td',{name: keys[i]}, keys[i]),
					 React.createElement('td',{name: keys[i]}, field)
					)
		    );
        }
	let save= React.createElement('input',{name:'save', type:'submit',value:'save'});
	let cancel= React.createElement('input',{name:'cancel', type:'button', onClick:()=>this.props.cancelClick(),value:'close'});
	return React.createElement('form',{id:'editform',name:'editform',onSubmit:(e)=>this.handleSubmit(e)},
				   React.createElement('table',{},React.createElement('tbody',{},res)),
				   save,cancel);
    }
}

class TableView extends React.Component{
    render() {
	let hres=[];
	let data=this.props.data;
	if (data==null || data.length<1)
	    return React.createElement('p',{},'data is null =(');
	
	let keys=Object.keys(data[Object.keys(data)[0]]);
	for (let i=0;i< keys.length;i++){
	    hres.push(React.createElement('td', { name: keys[i], key: keys[i] }, keys[i]));
        }
	let headlines=React.createElement('tr',{},hres);
	let datalines=[];
	let ids=Object.keys(data)
	for (var i = 0; i < ids.length; i++) {
            datalines.push(
		React.createElement(Tableline, {num:i, key:ids[i], data:data[ids[i]], editClick:(i)=>{this.props.editClick(i)}, delClick:(i)=>this.props.delClick(i)})
	    );

        }
	let thead=React.createElement('thead', null, headlines);
	let tbody=React.createElement('tbody', {}, datalines);
        return (React.createElement('table', { name: 'table' },
				    thead,
    				    tbody,
				   ));
    }
}


class Tableline extends React.Component{
    render() {
	var res = [];
        var data = this.props.data;
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
            res.push(React.createElement('td', { name: keys[i], key: keys[i] }, (data[keys[i]]===true)?'✔':data[keys[i]]));
        }
        return (
	    React.createElement('tr', {name:this.props.data.username},
				res,
				React.createElement('td', { name: 'control' },
						    React.createElement('button', { name: 'edit', onClick:()=>{this.props.editClick(this.props.data.id);} }, 'E'),
						    React.createElement('button', { name: 'delete', onClick:()=>{this.props.delClick(this.props.data.id);} }, 'X')))
	    
	);
    }
}

class Area extends React.Component{
    constructor(props){
	super(props);
	this.state={data:props.data,settings:props.settings,lists:props.lists, message:'', editmode:-1, message:'',datefrom:'2018-08-01',dateto:'2018-09-01'};
    }
    editObj(id) {
	this.setState({editmode:id});
    }
    delObj(id) {
	ajaxRequest('POST','delete',(a)=>this.updateData(a),JSON.stringify({id:id}));
    }
    updateData(responseText){
	let newdata=Object.assign(this.state.data);
	let answer = JSON.parse(responseText);
	if (answer['error'])
	    this.setState({message:answer['error']})
	else{
	    if (answer['saved']){
		for (var i=0;i<answer['saved'].length;i++){
		    let item=newdata.find((el)=>{return el.id==answer['saved'][i].id});
		    item?newdata.splice(newdata.indexOf(item),1,answer['saved'][i]):newdata.push(answer['saved'][i]);
		}
	    }
	    if (answer['deleted']){
		let item=newdata.find((el)=>{return el.id==answer['deleted']});
		if (item)
		    newdata.splice(newdata.indexOf(item),1)
	    }
	    this.setState({data:newdata})
	}
    }
    cancelEdit(){
	this.setState({editmode:-1});
    }
    
    saveEdit(data){
	ajaxRequest('POST','/exp/save',(u)=>this.updateData(u),JSON.stringify(data));
	this.setState({editmode:-1});
    }
    requestTable() {
	ajaxRequest('GET','/exp/table?from='+this.state.datefrom+'&to='+this.state.dateto,(d)=>this.processTable(d));
    }
    processTable(responseText) {
	let resp = JSON.parse(responseText);
	if (resp['error'])
	    this.setState({message:resp['error']})
	else
	    this.setState({ data:resp });
    }
    handleDateChange(event){
	    this.setState({[event.target.name]: event.target.value});
    }
    render() {
	let formbtn=React.createElement('button', { name: 'formview', onClick:()=>{this.editObj(-2);} }, 'new');
	let tablebtn=React.createElement('button', { name: 'tableview', onClick:()=>{this.requestTable();} }, 'table view');
	let datefrom=React.createElement('input',{name: 'datefrom', type:'date', value:this.state.datefrom, onChange:(e)=>{this.handleDateChange(e);},'data-date-format':"YYYY-DD-MM"});
	let dateto=React.createElement('input',{name: 'dateto', type:'date', value:this.state.dateto, onChange:(e)=>{this.handleDateChange(e);},'data-date-format':"YYYY-DD-MM"});
	
	let controls=React.createElement('div',{className:"col-lg-3 col-md-3 col-sm-12"},formbtn,tablebtn,datefrom,dateto);
	let status = React.createElement('div',{className:"col-lg-12 col-md-12 col-sm-12"},this.state.message);
	if (this.state.editmode==-2){
	    let empty={};
	    Object.keys(this.state.data[Object.keys(this.state.data)[0]]).map((key)=>{empty[key]='';})
	    let editview= React.createElement('div',{className:"col-lg-9 col-md-9 col-sm-12"},React.createElement(EditForm,{data:empty,settings:this.state.settings, lists:this.state.lists, saveClick:(form)=>{this.saveEdit(form)},cancelClick:()=>{this.cancelEdit()}}));
	    return (React.createElement('div',{className:"row"},controls,editview,status));
	}
	if (this.state.editmode>-1){
	    let editview=React.createElement('div',{className:"col-lg-9 col-md-9 col-sm-12"},React.createElement(EditForm,{data:this.state.data.find((el)=>{return el.id==this.state.editmode}), /*settings:this.state.settings,*/ lists:this.state.lists, saveClick:(form)=>{this.saveEdit(form)},cancelClick:()=>{this.cancelEdit()}}));
	    return (React.createElement('div',{className:"row"},controls,editview,status));
	}
	else{
	    let tableview=React.createElement('div',{className:"col-lg-9 col-md-9 col-sm-12"},React.createElement(TableView, { data:this.state.data, editClick:(id)=>this.editObj(id), delClick:(id)=>this.delObj(id),  name: 'users' }));
	    return (React.createElement('div',{className:"row"},controls,tableview,status));
	}
    }
}


    
