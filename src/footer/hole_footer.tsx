import { APP_NAME, VERSION} from "../globals/hole_globals"
import { Container } from "react-bootstrap"

const HoleFooter = () => {
    return(
    <footer className="footer py-3 mt-auto justify-content-center bg-dark text-secondary text-center">
        <Container>
            <span><strong>{APP_NAME}</strong> Version: {VERSION}</span>
        </Container>
    </footer>
    )
}

export {HoleFooter}