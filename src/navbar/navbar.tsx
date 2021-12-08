import {Navbar, Container, Nav} from 'react-bootstrap'
import { APP_NAME, VERSION } from '../globals/hole_globals';

const HolesNavbar = () =>
{
    return(
    <header className="mb-auto">
    <Navbar bg="dark" variant="dark">
        <Container>
            <Navbar.Brand><strong>{APP_NAME}</strong> {VERSION}</Navbar.Brand>
            <Nav className="me-auto">
                <Nav.Link href="/">New Map</Nav.Link>
            </Nav>
        </Container>
    </Navbar>
    </header>
    )
};


export {HolesNavbar}