# Project Setup Guide

## 1. Create a Virtual Environment
Create a virtual environment to manage the project's dependencies:

```bash
python -m venv myenv
```
This will create a virtual environment named myenv in the project folder.

## 2. Activate the Virtual Environment
Activate the virtual environment:

On Windows:

```bash
myenv\Scripts\activate
```

On macOS/Linux:

```bash
source myenv/bin/activate
```
After activating, your terminal should show the virtual environment's name (myenv) at the beginning of the command prompt.

## 3. Install Dependencies
Install the project dependencies specified in the requirements.txt file:

```bash
pip install -r requirements.txt
```
This will install all necessary packages and libraries into the virtual environment.

## 4. Start Developing
With the virtual environment activated and dependencies installed, you can start developing and running the project. Make sure to keep the virtual environment active whenever you work on the project.

## 5. Deactivating the Virtual Environment
When you are done working, you can deactivate the virtual environment with:

```bash
deactivate
```
Additional Notes
If you install new packages while working on the project, make sure to update the requirements.txt file by running:
```bash
pip freeze > requirements.txt
```
Make sure not to include your virtual environment (myenv/ or similar) in the repository. It should be excluded by adding it to the .gitignore file.

