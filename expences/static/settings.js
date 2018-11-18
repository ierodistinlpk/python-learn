// -*- encoding:utf-8-*-
//to onload. fill lists and default values. check record id in request. 
function load(){
    ajaxRequest('GET','/exp/init',function(a,b,c){loadHandler(a,b,c)});
}

function loadHandler(respdata,textStatus,jqXHR){
    let data=JSON.parse(respdata);
    ReactDOM.render(React.createElement(Area, {lists:data.lists,settings:data.settings, name: 'Settings' }),document.getElementById('area'));
}

class SettingsForm extends React.Component{
    constructor(props) {
	super(props);
	console.log(props);
	this.state = Object.assign({},props.data);
	if (props.settings){
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
    
    handleSubmit(event) {
	event.preventDefault();
	this.props.saveClick(this.state);
    }
    render(){
	var res=[];
        let lists={};
	for (var i=0;i<this.props.lists.length;i++){
	    lists[this.props.lists[i].name]=this.props.lists[i].values;
	}
	let keys = Object.keys(lists);
		
	for (var i = 0; i < keys.length; i++) {
	    let options=[];
	    for (var j=0;j<lists[keys[i]].length;j++){
		options.push(React.createElement('option',{key:lists[keys[i]][j]},lists[keys[i]][j]));
	    }
	    let field =  React.createElement('select',{name: keys[i], type:'text', value:this.state[keys[i]], onChange:this.handleChange},options)
            res.push(React.createElement('div', { className:"col-lg-3 col-md-12 col-sm-12 mt-2",name: keys[i], key: keys[i] },
					 React.createElement('p',{name: keys[i]}, keys[i]),
					 React.createElement('p',{name: keys[i]}, field)
					)
		    );
        }
	let save= React.createElement('input',{name:'save', type:'submit',value:'save', className:"mr-3  ml-0 m-lg-0"});
	let cancel= React.createElement('input',{name:'cancel', type:'button', className:"m-2  m-lg-0", onClick:()=>{location.href='./';},value:'close'});
	return React.createElement('form',{id:'editform',name:'editform',onSubmit:(e)=>this.handleSubmit(e)},
				   React.createElement('div',{className:"row"},res),
				   save,cancel);
    }
}

class Area extends React.Component{
    constructor(props){
	super(props);
	this.state={settings:props.settings,lists:props.lists, message:''};
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
    saveEdit(data){
	ajaxRequest('POST','/exp/savesettings',(u)=>this.updateData(u),JSON.stringify(data));
	this.setState({editmode:-1});
    }
    render() {
	let tablebtn=React.createElement('a', { name: 'tableview', href: './'}, 'expences view');
	let controls=React.createElement('div',{className:"col-12 mb-3"},tablebtn);
	let status = React.createElement('div',{className:"col-12"},this.state.message);
	let settings= React.createElement('div',{className:"col-12"},React.createElement(SettingsForm,{settings:this.state.settings, lists:this.state.lists, saveClick:(form)=>{this.saveEdit(form)},cancelClick:()=>{this.cancelEdit()}}));
	return (React.createElement('div',{className:"row"},controls,settings,status));
    }
}


    
