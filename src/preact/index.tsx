import { h, Component, render } from 'preact';
import { HomePage } from './pages/Home';
import { from, combineLatest, merge, of } from 'rxjs';
import { map, mergeMap, scan, tap } from 'rxjs/operators';

export interface AppState { restaurants: any[]; }
export interface AppProps { seed: any[]; }

const CONFIG = {
  apiKey: "AIzaSyC1pXdWIiJZRcJUYtoIi-MmrRdnTcUISgk",
  authDomain: "ticket-fire.firebaseapp.com",
  databaseURL: "https://ticket-fire.firebaseio.com",
  projectId: "ticket-fire",
  storageBucket: "ticket-fire.appspot.com",
  messagingSenderId: "1090774042344"
};

/**
 * Lazy load Firebase App, Firestore, and RxFire. 
 * @param config 
 */
function lazyLoad(config: any, enablePersistence = true) {
  const app$ = from(import('firebase/app'));
  // NOTE: The lazy load for Firestore does not work with TypeScipt
  // w/out hacking the node_modules/firebase/firestore/package.json file
  // to use "typings": "../index.d.ts".
  const firestore$ = from(import('firebase/firestore'));
  const rxfire$ = from(import('rxfire/firestore'));
  return combineLatest(app$, firestore$, rxfire$)
    .pipe(
      map(([firebase, firestore, rxfire]) => {
        const app = firebase.apps[0] || firebase.initializeApp(config);
        const settings = { timestampsInSnapshots: true};
        app.firestore().settings(settings);
        if(enablePersistence) { app.firestore().enablePersistence(); }
        return { app, rxfire };
      })
    );
}

/**
 * Lazy load a list of todos from RxFire
 * @param config 
 * @param collectionName 
 */
function lazyData(config: any, collectionName: string) {
  return lazyLoad(config)
    .pipe(
      mergeMap(load => {
        const { app, rxfire } = load;
        const ref = app.firestore().collection(collectionName);
        const obs$ = rxfire.collectionData(ref, 'id')
        return obs$;
      })
    );
}

class App extends Component<AppProps, AppState> {

  constructor() {
    super();
    this.state = { restaurants: [] };
  }

  componentDidMount() {
    const seed$ = merge(of(this.props.seed));
    const data$ = lazyData(CONFIG, 'restaurants');
    merge(seed$, data$).pipe(
      scan((restaurants: any[], updatedRestaurants: any[], index) => {
        return restaurants.map((r, i) => {
          const updated = updatedRestaurants[i];
          updated.previousOccupants = r.occupants;
          return updated;
        });
      }, this.props.seed)
    ).subscribe(restaurants => {
      this.setState({ restaurants });
    });
  }

  render() {
    return (
      <HomePage restaurants={this.state.restaurants} />
    );
  }
}

if ((window as any)['__data__']) {
  const data = (window as any)['__data__'];
  render(
    <App seed={data} />, 
    document.body, 
    document.querySelector('#root')!
  );
} else {
  render(
    <App seed={[]} />,
    document.querySelector('#root')!
  );
}
