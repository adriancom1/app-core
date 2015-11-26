// Export system component

module.exports = React.createClass({displayName:"HelloWorld",
	getInitialState : function() {
		return {counter : 0};
	},
	handleClick : function() {
		this.setState({counter: this.state.counter + 1});
	},
	render : function() {
		return React.createElement('h1', {className: 'myDiv', onClick: this.handleClick}, 'Hello World clicks: ' + this.state.counter);
	}
});