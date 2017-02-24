var React = require('react'),
  ReactDOM = require('react-dom'),
  FlipMove = require('react-flip-move'),
  search = require('./search');

/**
 * Geocoder component: connects to Mapbox.com Geocoding API
 * and provides an autocompleting interface for finding locations.
 */
var Geocoder = React.createClass({
  getDefaultProps() {
    return {
      endpoint: 'https://api.tiles.mapbox.com',
      inputClass: '',
      resultClass: '',
      resultsClass: '',
      resultFocusClass: 'strong',
      inputPosition: 'top',
      inputPlaceholder: 'Search',
      showLoader: false,
      source: 'mapbox.places',
      proximity: '',
      bbox: '',
      types: '',
      onSuggest: function() {},
      onInputChange: function() {},
      focusOnMount: true
    };
  },
  getInitialState() {
    return {
      results: [],
      focus: null,
      loading: false,
      searchTime: new Date(),
      showList: false,
      inputValue: '',
      typedInput: '', // this is what the user has explicitly typed
    };
  },
  propTypes: {
    endpoint: React.PropTypes.string,
    source: React.PropTypes.string,
    inputClass: React.PropTypes.string,
    resultClass: React.PropTypes.string,
    resultsClass: React.PropTypes.string,
    inputPosition: React.PropTypes.string,
    inputPlaceholder: React.PropTypes.string,
    resultFocusClass: React.PropTypes.string,
    onSelect: React.PropTypes.func.isRequired,
    onSuggest: React.PropTypes.func,
    onInputChange: React.PropTypes.func,
    accessToken: React.PropTypes.string.isRequired,
    proximity: React.PropTypes.string,
    bbox: React.PropTypes.string,
    showLoader: React.PropTypes.bool,
    focusOnMount: React.PropTypes.bool,
    types: React.PropTypes.string
  },
  componentDidMount() {
    if (this.props.focusOnMount) ReactDOM.findDOMNode(this.refs.input).focus();
  },
  onInput(e) {
    var value = e.target.value;
    this.setState({loading:true, showList: true, inputValue: value, typedInput: value});
    this.props.onInputChange(value);
    if (value === '') {
      this.setState({
        results: [],
        focus: null,
        loading:false,
        showList:false
      });
    } else {
      search(
        this.props.endpoint,
        this.props.source,
        this.props.accessToken,
        this.props.proximity,
        this.props.bbox,
        this.props.types,
        value,
        this.onResult);
    }
  },
  moveFocus(dir) {
    if(this.state.loading) return;
    var focus = this.state.focus === null ?
        0 : Math.max(-1,
          Math.min(
            this.state.results.length - 1,
            this.state.focus + dir));
    var inputValue = focus === -1 ? this.state.typedInput : this.state.results[focus].place_name;
    this.setState({
      focus: focus,
      inputValue: inputValue,
      showList: true
    });
    this.props.onInputChange(inputValue);
  },
  acceptFocus() {
    if (this.state.focus !== null && this.state.focus !== -1) {
      var inputValue = this.state.results[this.state.focus].place_name;
      this.setState({showList: false, inputValue: inputValue});
      this.props.onInputChange(inputValue);
      this.props.onSelect(this.state.results[this.state.focus]);
    }
  },
  onKeyDown(e) {
    switch (e.which) {
      // up
      case 38:
        e.preventDefault();
        this.moveFocus(-1);
        break;
      // down
      case 40:
        e.preventDefault();
        this.moveFocus(1);
        break;
      // tab
      case 9:
        this.acceptFocus();
        break;
      // esc
      case 27:
        this.setState({showList:false, results:[]});
        break;
      // accept
      case 13:
        if( this.state.results.length > 0 && this.state.focus == null) {
          this.clickOption(this.state.results[0],0);
        }
        this.acceptFocus();
        e.preventDefault();
        break;
    }
  },
  onResult(err, res, body, searchTime) {
    // searchTime is compared with the last search to set the state
    // to ensure that a slow xhr response does not scramble the
    // sequence of autocomplete display.
    if (!err && body && body.features && this.state.searchTime <= searchTime) {
      this.setState({
        searchTime: searchTime,
        loading: false,
        results: body.features,
        focus: 0
      });
      this.props.onSuggest(this.state.results);
    }
  },
  clickOption(place, listLocation, e) {
    this.props.onInputChange(place.place_name);
    this.props.onSelect(place);
    this.setState({focus:listLocation, showList: false, inputValue: place.place_name});
    // focus on the input after click to maintain key traversal
    ReactDOM.findDOMNode(this.refs.input).focus();
    if (e) {
      e.preventDefault();
    }
  },
  handleBlur(e) {
    if (!e || !e.relatedTarget || !e.relatedTarget.parentElement || !e.relatedTarget.parentElement.parentElement || e.relatedTarget.parentElement.parentElement.id !== "react-geo-list") {
      this.setState({showList:false});
    }
  },
  render() {
    var input = <input
      ref='input'
      className={this.props.inputClass}
      onInput={this.onInput}
      onKeyDown={this.onKeyDown}
      placeholder={this.props.inputPlaceholder}
      onBlur={this.handleBlur}
      type='text'
      value={this.state.inputValue} />;
    return (
      <div>
        {this.props.inputPosition === 'top' && input}
        <FlipMove
                    delay={0}
                    duration={500}
                    enterAnimation="accordionVertical"
                    leaveAnimation="accordionVertical"
                >
          {this.state.results.length > 0 && this.state.showList && (
            <ul key="needed-for-flip-move" id="react-geo-list" className={`${this.props.showLoader && this.state.loading ? 'loading' : ''} ${this.props.resultsClass}`}>
              {this.state.results.map((result, i) => (
                <li key={result.id}>
                  <a href='#'
                    onClick={this.clickOption.bind(this, result, i)}
                    tabIndex="-1"
                    className={this.props.resultClass + ' ' + (i === this.state.focus ? this.props.resultFocusClass : '')}
                    key={result.id}>{result.place_name}</a>
                </li>
              ))}
            </ul>
          )}
          </FlipMove>
        {this.props.inputPosition === 'bottom' && input}
      </div>
    );
  }
});

module.exports = Geocoder;
