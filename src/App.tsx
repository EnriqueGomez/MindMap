import { Suspense} from 'react';
import { BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import { HolesNavbar } from './navbar/navbar';
import { LoginForm } from './login/login';
import { HoleFooter } from './footer/hole_footer';
import { Editor } from './editor/editor';
import './App.css';

const App = () => (
  <>
      <div className="d-flex flex-column h-100">
      <HolesNavbar></HolesNavbar>
      <Router>
        <Suspense fallback={<div>Loading...</div>}>
          <Switch>
            <Route exact path="/" component={Editor}/>
          </Switch>
        </Suspense>
      </Router>
        <HoleFooter></HoleFooter>
      </div>
    </>
);

export default App;
