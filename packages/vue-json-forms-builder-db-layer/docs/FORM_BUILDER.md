# Data Structure of the FormBuilder

## Overview

A form is fully represented within a json object. Exports for different artifacts like json and ui schema exist. An class hierarchy exists which takes the internal json representation as an input to create itself. Different methods exists to do the json and ui schema artefact exports.

### Redundant data like paths

The path of an form element (like `address/street`) is redundant and therefore not stored within the database. It can be implicitly derived from the json structure. But how and when to store the paths in the object hierarchy.

- always update: create the paths initially when the objects are parsed form the database json. On each operation like rename and move, the paths need to be updated and cascaded for children elements
  - + paths are always available -> no unnecessary recalculation for operations like change operations since they need the path of the element to change
  - - redundancy -> more complex to implement / error prone
- no paths are stored and each operation needing them needs to calculate them
  - + no redundancy -> simple logic
  - - potentially expensive

__Note:__ other redundant fields could be: required

### Change Operations

There are Operations (`edit`, `add`, `remove`, `move`) which can be performed on the form elements. A path specifies the element in the form on which the operation should be performed.

- `edit(parentPath: string, element: Partial<FormElement>)`: edit the element at the given path. Only change values are provided (using partial form element).
  - throws exception if:
    - element with id doesn't exist
    - parent path doesn't exist
    - FormElement type doesn't match with the current one
- `add(parentPath: string, element: FormElement)`: add a new element at the given parent path
  - throws exception if:
    - parent path doesn't exist
    - element with id already exists
- `remove(path: string)`: remove the element at the given path
  - throws exception if:
    - path doesn't exist
- `move(fromPath: string, toPath: string)`: move the element from one path to another
  - throws exception if:
    - fromPath doesn't exist
    - toPath exists

These functions both exist on frontend and backend. When the frontend makes a change, it sends a request to the backend and if the backend approves it, the backend integrates the change into its state and then the frontend integrates the change after approval.

Collision problems:
