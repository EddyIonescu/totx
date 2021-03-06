import * as React from 'react';

import {Layer, Source} from 'react-mapbox-gl';
import * as _ from 'underscore';
import {shallowEqual} from '../../utils';

export interface Props {
  idProperty: string;
  fillColors: {[geoId: string]: string};
  defaultFillColor: string;

  visibility: 'visible' | 'none';
  before?: string;
}

interface State {
  /** Same as props.geojson, but with fillColor set */
  styleExpression: any;
}

function makeStyleExpression(
  idProperty: string,
  fillColors: {[geoId: string]: string},
  defaultColor: string,
) {
  if (_.isEmpty(fillColors)) {
    return {'fill-color': defaultColor}; // Mapbox GL outputs an error without this special case.
  }

  const expr: any[] = ['match', ['get', idProperty]];
  for (const geoId in fillColors) {
    expr.push(geoId, fillColors[geoId]);
  }
  expr.push(defaultColor);
  return {
    'fill-color': expr,
    'fill-outline-color': 'rgba(0, 0, 0, 0.0)',
  };
}

const TILE_SOURCE: mapboxgl.VectorSource = {
  type: 'vector',
  url: 'mapbox://sidewalk-users.5zdxqa9p',
};

export class ChoroplethLayer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      styleExpression: makeStyleExpression(
        props.idProperty,
        props.fillColors,
        props.defaultFillColor,
      ),
    };
  }

  render() {
    const {before, visibility} = this.props;
    return (
      <>
        <Source id="das-tile" tileJsonSource={TILE_SOURCE} />
        <Layer
          id="choropleth"
          type="fill"
          sourceId="das-tile"
          sourceLayer="torontoslim"
          paint={this.state.styleExpression}
          layout={{visibility}}
          before={before}
        />
      </>
    );
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const out =
      !shallowEqual(this.props, nextProps) ||
      nextState.styleExpression !== this.state.styleExpression;
    return out;
  }

  componentWillReceiveProps(nextProps: Props) {
    const {idProperty, fillColors, defaultFillColor} = nextProps;
    if (
      fillColors === this.props.fillColors &&
      defaultFillColor === this.props.defaultFillColor &&
      idProperty === this.props.idProperty
    ) {
      return;
    }

    this.setState({
      styleExpression: makeStyleExpression(idProperty, fillColors, defaultFillColor),
    });
  }
}
