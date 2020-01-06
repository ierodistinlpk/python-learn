//My table-with-edited-lines-sorting-and-pagination lib
function TableView(props){
    let hres=[];
    let data=props.data;
    if (data==null || data.length<1)
	return React.createElement('p',{},'no data to show');
    let keys=Object.keys(data[Object.keys(data)[0]]);
	for (let i=0;i< keys.length;i++){
	    	if (keys[i]!='id')
		    hres.push(React.createElement('td', { name: keys[i], key: keys[i] }, keys[i]));
        }
    let headlines=React.createElement('tr',{},hres);
    let datalines=[];
    let ids=Object.keys(data)
    for (let i = 0; i < ids.length; i++) {
        datalines.push(
	    React.createElement(Tableline, {num:i, key:ids[i], data:data[ids[i]], editClick:(i)=>{props.editClick(i)}, delClick:(i)=>props.delClick(i), readonly:props.readonly})
	);
	
    }
    let thead=React.createElement('thead', null, headlines);
    let tbody=React.createElement('tbody', {}, datalines);
    return (React.createElement('table', { name: 'table' },
				thead,
    				tbody,
			       ));
}

function Tableline(props){
    var res = [];
    var data = props.data;
    var keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
	if (keys[i]!='id')
            res.push(React.createElement('td', { name: keys[i], key: keys[i] }, (data[keys[i]]===true)?'✔':data[keys[i]]));
    }
    let bootstrap='border-top';
    return (
	React.createElement('tr', {name:props.data.username, className:bootstrap},
			    res,
			    (props.readonly)?null:React.createElement('td', { name: 'control' },
						React.createElement('button', { name: 'edit', onClick:()=>{props.editClick(props.data.id);} }, 'E'),
						React.createElement('button', { name: 'delete', onClick:()=>{props.delClick(props.data.id);} }, 'X')))
    );
}

