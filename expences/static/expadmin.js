// -*- encoding:utf-8-*-
//to onload. fill lists and default values. check record id in request. 
function load(){
    ajaxRequest('GET','admindata',function(a,b,c){loadHandler(a,b,c)});
}

function loadHandler(respdata,textStatus,jqXHR){
    let data=JSON.parse(respdata);
    ReactDOM.render(React.createElement(Area, { lists:data.lists, name: 'Admin' }),document.getElementById('area'));
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

class Editline extends React.Component{
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

class ListTableView extends React.Component{
    render() {
	let data=this.props.data;
	if (data==null || data.length<1)
	    return React.createElement('p',{},'data is null =(');
	
	let header=React.createElement('td', { name: data.name}, data.name);
	let headlines=React.createElement('tr',{},header);
	let datalines=[];
	let ids=data.values;
	for (var i = 0; i < ids.length; i++) {
            datalines.push(
		React.createElement(Tableline, {key:ids[i], data:ids[i], list:data.name , delClick:(list,i)=>this.props.delClick(list,i)})
	    );
        }
	//adding new line at bottomm
	datalines.push(React.createElement(ControlledTableline, {key:'new',list:data.name , saveClick:(list,i)=>this.props.saveClick(list,i)}) );

	let thead=React.createElement('thead', null, headlines);
	let tbody=React.createElement('tbody', {}, datalines);
        return (React.createElement('table', { name: data.name },
				    thead,
    				    tbody,
				   ));
    }
}


class Tableline extends React.Component{
    render() {
	var data = this.props.data;
        return (
	    React.createElement('tr', {name:data},
				React.createElement('td', {name:data, key:data}, data),
				React.createElement('td', { name: 'control' },
						    React.createElement('button', { name: 'delete', onClick:()=>{this.props.delClick(this.props.list, data);} }, 'delete')))
	    
	);
    }
}

class ControlledTableline extends React.Component{
    constructor(props){
	super(props);
	this.state={value:''};
	this.handleChange = this.handleChange.bind(this);
    }
    handleChange(event){
	this.setState({value:event.target.value});
    }
    render() {
	let inp=React.createElement('input',{name:'new_'+this.props.list,onChange:this.handleChange,defaultValue:''});
	return (
		React.createElement('tr', {},
				    React.createElement('td', {}, inp),
				    React.createElement('td', { name: 'control' },
							React.createElement('button', { name: 'save', onClick:()=>{this.props.saveClick(this.props.list, this.state.value);} }, 'save')))
	    
	);
    }

}

class Area extends React.Component{
    constructor(props){
	super(props);
	this.state={lists:props.lists};
    }
    //handling deleting object from 
    delObj(list, id) {
	ajaxRequest('POST','admindelete',(a)=>this.updateData(a),JSON.stringify({[list]:id}));
    }
    saveObj(list, id) {
	ajaxRequest('POST','adminsave',(a)=>this.updateData(a),JSON.stringify({[list]:id}));
    }
    
    updateData(responseText){
	let answer = JSON.parse(responseText);
	if (answer['error'])
	    this.setState({message:answer['error']})
	else{
	    let changed=this.state['lists'].slice();	
	    if (answer['saved']){
		let listname = Object.keys(answer['saved'])[0]
		var list=changed.find((el)=>{return el.name=listname});
		console.log(list)
		list['values'].push(answer['saved'][listname]);
	    }
	    if (answer['deleted']){
		let listname = Object.keys(answer['deleted'])[0]
		var dellist=changed.find((el)=>{return el.name=listname});
		dellist['values'].splice(dellist['values'].indexOf(answer['deleted'][listname]),1);
	
	    }
	this.setState({lists:changed});
	}
    }
    render() {
	console.log(this.state);

	let tablebtn=React.createElement('a', { name: 'tableview', href: './'}, 'expences view');
	
	let controls=React.createElement('div',{},tablebtn);
	let status = React.createElement('div',{},this.state.message);
	let tableviews=[];
	for (var i=0; i<this.state.lists.length;i++){
	    var list=this.state.lists[i];
	    tableviews.push(React.createElement(ListTableView, { data:list, delClick:(list,id)=>this.delObj(list,id), saveClick:(list,id)=>this.saveObj(list,id) , name: list['name'], key:list['name'] }));
	}
	return (React.createElement('div',{},tablebtn,tableviews,status));
    }
}


    
