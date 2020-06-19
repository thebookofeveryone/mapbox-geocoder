import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import xhr from "xhr";

/**
 * Geocoder component: connects to Mapbox.com Geocoding API
 * and provides an autocompleting interface for finding locations.
 */

class Geocoder extends Component {
  constructor(props) {
    super(props);

    this.state = {
      results: [],
      focus: null,
      searchTime: new Date(),
      showList: false,
      inputValue: "",
      typedInput: "",
    };

    this.onInput = this.onInput.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResult = this.onResult.bind(this);
  }

  componentWillMount() {
    this.setState({ inputValue: this.props.defaultInputValue });
  }

  componentDidMount() {
    document.addEventListener("click", (e) => {
      if (this.state.showList && !container.contains(e.target)) {
        this.setState({ showList: false });
      }
    });
  }

  componentWillReceiveProps(props) {
    if (props.defaultInputValue !== this.props.inputValue) {
      this.setState({ inputValue: props.defaultInputValue });
    }
  }

  search(
    endpoint,
    source,
    accessToken,
    proximity,
    bbox,
    types,
    query,
    callback
  ) {
    var searchTime = new Date();
    var uri =
      endpoint +
      "/geocoding/v5/" +
      source +
      "/" +
      encodeURIComponent(query) +
      ".json" +
      "?access_token=" +
      accessToken +
      (proximity ? "&proximity=" + proximity : "") +
      (bbox ? "&bbox=" + bbox : "") +
      (types ? "&types=" + encodeURIComponent(types) : "");
    xhr(
      {
        uri: uri,
        json: true,
      },
      function (err, res, body) {
        callback(err, res, body, searchTime);
      }
    );
  }

  onInput(e) {
    var value = e.target.value;

    this.setState({
      showList: true,
      inputValue: value,
      typedInput: value,
    });

    this.props.onInputChange(value);

    if (value === "") {
      this.setState({
        results: [],
        focus: null,
      });
    } else {
      this.search(
        this.props.endpoint,
        this.props.source,
        this.props.accessToken,
        this.props.proximity,
        this.props.bbox,
        this.props.types,
        value,
        this.onResult
      );
    }
  }
  moveFocus(dir) {
    var focus =
      this.state.focus === null
        ? 0
        : Math.max(
            -1,
            Math.min(this.state.results.length - 1, this.state.focus + dir)
          );
    var inputValue =
      focus === -1
        ? this.state.typedInput
        : this.state.results[focus].place_name;
    this.setState({
      focus: focus,
      inputValue: inputValue,
      showList: true,
    });
    this.props.onInputChange(inputValue);
  }
  acceptFocus() {
    if (this.state.focus !== null && this.state.focus !== -1) {
      var inputValue = this.state.results[this.state.focus].place_name;
      this.setState({ showList: false, inputValue: inputValue });
      this.props.onInputChange(inputValue);
      this.props.onSelect(this.state.results[this.state.focus]);
    }
  }
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
        this.setState({ showList: false, results: [] });
        break;
      // accept
      case 13:
        if (this.state.results.length > 0 && this.state.focus == null) {
          this.clickOption(this.state.results[0], 0);
        }
        this.acceptFocus();
        e.preventDefault();
        break;
      default:
        break;
    }
  }

  onResult(err, res, body, searchTime) {
    // searchTime is compared with the last search to set the state
    // to ensure that a slow xhr response does not scramble the
    // sequence of autocomplete display.
    if (!err && body && body.features && this.state.searchTime <= searchTime) {
      this.setState({
        searchTime: searchTime,
        results: body.features,
        focus: 0,
      });
      this.props.onSuggest(this.state.results);
    }
  }

  clickOption(place, index, e) {
    if (e) {
      e.preventDefault();
    }

    this.props.onInputChange(place.place_name);
    this.props.onSelect(place);

    this.setState({
      focus: index,
      showList: false,
      inputValue: place.place_name,
    });
  }

  render() {
    const {
      endpoint,
      defaultInputValue,
      source,
      inputPosition,
      inputPlaceholder,
      onSelect,
      onSuggest,
      onInputChange,
      accessToken,
      proximity,
      bbox,
      types,
      ...inputProps
    } = this.props;

    var input = React.createElement("input", {
      ...inputProps,

      ref: "input",
      // onInput: this.onInput,
      onKeyDown: this.onKeyDown,
      type: "text",
      // defaultValue: this.state.inputValue
      value: this.state.inputValue,
      onChange: this.onInput,
    });

    return React.createElement(
      "div",
      {
        ref: (ref) => {
          this.container = ref;
        },
        className: "mapbox-autocomplete-container",
      },
      this.props.inputPosition === "top" && input,
      React.createElement(
        "div",
        {
          className: [
            "mapbox-autocomplete",
            this.state.showList && "is-open",
          ].join(" "),
        },
        this.state.results.map((result, i) => {
          return React.createElement(
            "div",
            {
              key: result.id,
              onClick: this.clickOption.bind(this, result, i),
              className: [
                "item",
                i === this.state.focus ? "selected" : "",
              ].join(" "),
            },
            React.createElement("span", {}, result.place_name)
          );
        })
      ),
      this.props.inputPosition === "bottom" && input
    );
  }
}

Geocoder.defaultProps = {
  endpoint: "https://api.tiles.mapbox.com",
  defaultInputValue: "",
  inputPosition: "top",
  inputPlaceholder: "Search",
  source: "mapbox.places",
  proximity: "",
  bbox: "",
  types: "",
  onSuggest: function onSuggest() {},
  onInputChange: function onInputChange() {},
};

Geocoder.propTypes = {
  endpoint: PropTypes.string,
  defaultInputValue: PropTypes.string,
  source: PropTypes.string,
  inputPosition: PropTypes.string,
  inputPlaceholder: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onSuggest: PropTypes.func,
  onInputChange: PropTypes.func,
  accessToken: PropTypes.string.isRequired,
  proximity: PropTypes.string,
  bbox: PropTypes.string,
  types: PropTypes.string,
};
export default Geocoder;
