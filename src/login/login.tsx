import React from 'react';
import FormControl from 'react-bootstrap/FormControl';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { Col, Form, FormGroup, Row, Container} from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
type Login_Form_State = { 
    user_name:string,
    password:string,
}

type Login_Form_Props = {}

type InputField_Props = {
    label:string,
    onChange:React.ChangeEventHandler<HTMLInputElement>,
    value:string,
    id:string
    type:string
}

function InputField(props:InputField_Props)
{
    return (
            <FormGroup className="mb-2">
                <FloatingLabel label={props.label} controlId={props.id}>
                    <FormControl type={props.type} onChange={props.onChange} placeholder=" "/>
                </FloatingLabel>
            </FormGroup>
    )
}

class LoginForm extends React.Component<Login_Form_Props, Login_Form_State> {
    constructor(props:any)
    {
        super(props)
        this.state = {
            user_name: '',
            password: ''
        }
        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleUsernameChange: React.ChangeEventHandler<HTMLInputElement> = (event:React.FormEvent<HTMLInputElement>) =>
    {
        this.setState({user_name:event.currentTarget.value});
    }
    
    handlePasswordChange: React.ChangeEventHandler<HTMLInputElement> = (event:React.FormEvent<HTMLInputElement>) =>
    {
        this.setState({password:event.currentTarget.value});
    }

    handleSubmit: React.FormEventHandler<HTMLFormElement> = (event:React.FormEvent<HTMLFormElement>) =>
    {
        alert('A user_name was submitted: ' + this.state.user_name);
        alert('A password was submitted: ' + this.state.password);
        event.preventDefault();
    }

    render(){
        return(
            <>
                <Container className="my-auto">
                    <Form id="Login_Form" onSubmit={this.handleSubmit}>
                            <Row>
                                <Col xs={6} className="mx-auto">
                                    <InputField type="email" label="User Name" value={this.state.user_name} onChange={this.handleUsernameChange} id="user_name"></InputField>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={6} className="mx-auto">
                                    <InputField type="password" label="Password" value={this.state.password} onChange={this.handlePasswordChange} id="password"></InputField>
                                    <hr/>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={4} className="mx-auto">
                                    <Button className="text-center w-100" variant="outline-success" type="submit" size="sm">Login</Button>
                                </Col>
                            </Row>
                    </Form>
                </Container>
            </>
        )
    }
}

export {LoginForm}