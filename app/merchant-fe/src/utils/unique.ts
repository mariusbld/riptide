// https://stackoverflow.com/questions/29420835/how-to-generate-unique-ids-for-form-labels-in-react
export const uniqueId = (): string => "component-" + (Math.random().toString(36)+'00000000000000000').slice(2, 7);
