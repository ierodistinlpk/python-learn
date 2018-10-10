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

	let thead=React.createElement('thead', {className:"bg-light"}, headlines);
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
		var list=changed.find((el)=>{return el.name==listname});
		list.values.push(answer['saved'][listname]);
	    }
	    if (answer['deleted']){
		let listname = Object.keys(answer['deleted'])[0]
		var dellist=changed.find((el)=>{return el.name==listname});
		dellist.values.splice(dellist['values'].indexOf(answer['deleted'][listname]),1);
	    }
	    this.setState({lists:changed});

	}
    }
    render() {
	//console.log(this.state);

	let tablebtn=React.createElement('a', { name: 'tableview', href: './'}, 'expences view');
	
	let controls=React.createElement('div',{className:"col-lg-1 col-md-1 col-sm-12"},tablebtn);
	let status = React.createElement('div',{className:"col-lg-12 col-md-12 col-sm-12"},this.state.message);
	let tableviews=[];
	for (var i=0; i<this.state.lists.length;i++){
	    var list=this.state.lists[i];
	    tableviews.push(React.createElement('div',{key:i, className:"col-lg-3 col-md-6 col-sm-12"},React.createElement(ListTableView, { data:list, delClick:(list,id)=>this.delObj(list,id), saveClick:(list,id)=>this.saveObj(list,id) , name: list['name'], key:list['name'] })));
	}
	return (React.createElement('div',{className:"row"},controls,tableviews,status));
    }
}


    
