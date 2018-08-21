import { h, Component } from 'preact';

export interface HomeProps {
  restaurants: any[];
}

export class HomePage extends Component<HomeProps, never> {
  render() {
    const lis = this.props.restaurants.map(r => {
      const capacityFilled = (r.occupants / r.capacity) * 100;
      const percentage = Math.round(capacityFilled);
      const previousOccupants = r.previousOccupants || r.occupants;
      const cssAnimClass = previousOccupants !== r.occupants ? 
        'tt-listitem flash-change' : 'tt-listitem';
      return (
        <li class={cssAnimClass}>
          <div class="tt-listitem-text">
            {r.name}
          </div>
          <div class="tt-listitem-type">
            {r.type}
          </div>
          <div class="tt-listitem-tracer">
            <span class="tt-tracer-occupants">{r.occupants} people</span>
            <span class="tt-tracer-capacity">{percentage}%</span>
          </div>
        </li>
      );
    });
    return (
      <div class="tt-container">
        <ul class="tt-list">
          {lis}
        </ul>
      </div>
    );
  }
}
