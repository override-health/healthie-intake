"""
Healthie GraphQL API Client
Port of HealthieIntake.Api.Services.HealthieApiClient from .NET
"""
from typing import List, Optional, Dict, Any
from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport
from models import Patient, CustomModuleForm, CustomModule, FormAnswerGroupInput


class HealthieApiClient:
    """GraphQL client for Healthie API - exact port of .NET HealthieApiClient"""

    def __init__(self, api_url: str, api_key: str):
        """
        Initialize Healthie API client

        Args:
            api_url: Healthie GraphQL API endpoint
            api_key: API authentication key
        """
        transport = RequestsHTTPTransport(
            url=api_url,
            headers={
                'Authorization': f'Basic {api_key}',
                'AuthorizationSource': 'API'
            },
            verify=True,
            retries=3,
        )

        self.client = Client(transport=transport, fetch_schema_from_transport=False)

    async def get_patient_async(self, patient_id: str) -> Optional[Patient]:
        """
        Get patient by ID

        Args:
            patient_id: Patient ID

        Returns:
            Patient object or None
        """
        query = gql("""
            query($id: ID!) {
                user(id: $id) {
                    id
                    email
                    first_name
                    last_name
                }
            }
        """)

        try:
            result = self.client.execute(query, variable_values={"id": patient_id})
            user_data = result.get('user')

            if not user_data:
                return None

            return Patient(
                id=user_data.get('id', ''),
                email=user_data.get('email', ''),
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', '')
            )
        except Exception as e:
            raise Exception(f"Error fetching patient: {str(e)}")

    async def search_patients_async(self, first_name: str, last_name: str, dob: str) -> List[Patient]:
        """
        Search for patients by name and date of birth

        Args:
            first_name: Patient first name
            last_name: Patient last name
            dob: Date of birth in YYYY-MM-DD format

        Returns:
            List of matching Patient objects
        """
        # Construct search keywords from name
        keywords = f"{first_name} {last_name}".strip()

        query = gql("""
            query($keywords: String!) {
                users(should_paginate: false, keywords: $keywords) {
                    id
                    email
                    first_name
                    last_name
                    dob
                }
            }
        """)

        try:
            result = self.client.execute(query, variable_values={"keywords": keywords})
            users_data = result.get('users', [])

            # Filter by DOB if provided
            matching_patients = []
            for user_data in users_data:
                user_dob = user_data.get('dob')

                # If DOB matches or no DOB filter provided, include the patient
                if dob and user_dob:
                    if user_dob == dob:
                        matching_patients.append(Patient(
                            id=user_data.get('id', ''),
                            email=user_data.get('email', ''),
                            first_name=user_data.get('first_name', ''),
                            last_name=user_data.get('last_name', '')
                        ))
                elif not dob:
                    # No DOB filter, include all name matches
                    matching_patients.append(Patient(
                        id=user_data.get('id', ''),
                        email=user_data.get('email', ''),
                        first_name=user_data.get('first_name', ''),
                        last_name=user_data.get('last_name', '')
                    ))

            return matching_patients
        except Exception as e:
            raise Exception(f"Error searching patients: {str(e)}")

    async def get_custom_form_async(self, form_id: str) -> Optional[CustomModuleForm]:
        """
        Get custom form structure by ID

        Args:
            form_id: Form ID

        Returns:
            CustomModuleForm object or None
        """
        query = gql("""
            query($id: ID!) {
                customModuleForm(id: $id) {
                    id
                    name
                    custom_modules {
                        id
                        label
                        mod_type
                        required
                        options
                    }
                }
            }
        """)

        try:
            result = self.client.execute(query, variable_values={"id": form_id})
            form_data = result.get('customModuleForm')

            if not form_data:
                return None

            # Parse custom modules
            modules = []
            for module_data in form_data.get('custom_modules', []):
                # Handle options (can be array or None)
                options = module_data.get('options')
                if options and isinstance(options, list):
                    options = [str(opt) for opt in options if opt is not None]
                else:
                    options = None

                modules.append(CustomModule(
                    id=module_data.get('id', ''),
                    label=module_data.get('label', ''),
                    mod_type=module_data.get('mod_type', ''),
                    required=module_data.get('required', False),
                    options=options
                ))

            return CustomModuleForm(
                id=form_data.get('id', ''),
                name=form_data.get('name', ''),
                custom_modules=modules
            )
        except Exception as e:
            raise Exception(f"Error fetching form: {str(e)}")

    async def create_form_answer_group_async(self, input_data: FormAnswerGroupInput) -> str:
        """
        Create form answer group (submit form)

        Args:
            input_data: Form submission data

        Returns:
            Form answer group ID
        """
        mutation = gql("""
            mutation createFormAnswerGroup($input: createFormAnswerGroupInput!) {
                createFormAnswerGroup(input: $input) {
                    form_answer_group {
                        id
                        finished
                    }
                    messages {
                        field
                        message
                    }
                }
            }
        """)

        # Convert Pydantic model to GraphQL input format
        graphql_input = {
            'custom_module_form_id': input_data.custom_module_form_id,
            'user_id': input_data.user_id,
            'finished': True,
            'form_answers': [
                {
                    'custom_module_id': answer.custom_module_id,
                    'answer': answer.answer
                }
                for answer in input_data.form_answers
            ]
        }

        try:
            result = self.client.execute(
                mutation,
                variable_values={'input': graphql_input}
            )

            response = result.get('createFormAnswerGroup', {})

            # Check for validation messages
            messages = response.get('messages', [])
            if messages:
                error_msgs = [f"{msg.get('field')}: {msg.get('message')}" for msg in messages]
                raise Exception(f"Validation errors: {', '.join(error_msgs)}")

            # Get form answer group
            form_answer_group = response.get('form_answer_group')
            if not form_answer_group:
                raise Exception("Form submission failed - no form_answer_group returned")

            form_id = form_answer_group.get('id', '')
            is_finished = form_answer_group.get('finished', False)

            print(f"DEBUG: Form created with ID {form_id}, finished={is_finished}")

            return form_id
        except Exception as e:
            raise Exception(f"Error creating form answer group: {str(e)}")

    async def get_form_answer_group_details_async(self, form_answer_group_id: str) -> Dict[str, Any]:
        """
        Get form answer group details

        Args:
            form_answer_group_id: Form answer group ID

        Returns:
            Form answer group details
        """
        query = gql("""
            query($id: ID!) {
                formAnswerGroup(id: $id) {
                    id
                    finished
                    created_at
                    form_answers {
                        id
                        answer
                        displayed_answer
                        custom_module {
                            id
                            label
                            mod_type
                        }
                    }
                }
            }
        """)

        try:
            result = self.client.execute(query, variable_values={"id": form_answer_group_id})
            return result
        except Exception as e:
            raise Exception(f"Error fetching form answer group details: {str(e)}")

    async def get_form_answer_groups_for_patient_async(self, patient_id: str) -> List[str]:
        """
        Get list of form answer group IDs for a patient

        Args:
            patient_id: Patient ID

        Returns:
            List of form answer group IDs
        """
        query = gql("""
            query($userId: String) {
                formAnswerGroups(user_id: $userId) {
                    id
                    custom_module_form {
                        id
                        name
                    }
                    created_at
                }
            }
        """)

        try:
            result = self.client.execute(query, variable_values={"userId": patient_id})
            form_answer_groups = result.get('formAnswerGroups', [])

            ids = []
            print(f"\nFound {len(form_answer_groups)} form answer group(s) for patient {patient_id}:")
            for group in form_answer_groups:
                group_id = group.get('id', '')
                form_name = group.get('custom_module_form', {}).get('name', '')
                created_at = group.get('created_at', '')
                ids.append(group_id)
                print(f"  - ID: {group_id}, Form: {form_name}, Created: {created_at}")

            return ids
        except Exception as e:
            raise Exception(f"Error fetching form answer groups: {str(e)}")

    async def delete_form_answer_group_async(self, form_answer_group_id: str) -> bool:
        """
        Delete form answer group

        Args:
            form_answer_group_id: Form answer group ID

        Returns:
            True if successful
        """
        mutation = gql("""
            mutation deleteFormAnswerGroup($input: deleteFormAnswerGroupInput!) {
                deleteFormAnswerGroup(input: $input) {
                    messages {
                        field
                        message
                    }
                }
            }
        """)

        try:
            result = self.client.execute(
                mutation,
                variable_values={'input': {'id': form_answer_group_id}}
            )

            # Check for error messages
            response = result.get('deleteFormAnswerGroup', {})
            messages = response.get('messages', [])
            if messages:
                error_msgs = [f"{msg.get('field')}: {msg.get('message')}" for msg in messages]
                raise Exception(f"Delete errors: {', '.join(error_msgs)}")

            return True
        except Exception as e:
            raise Exception(f"Error deleting form answer group: {str(e)}")
