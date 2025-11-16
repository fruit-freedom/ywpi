import { test, expect, it } from '@jest/globals';
import renderer from 'react-test-renderer';

import { Item } from '../Chat';



test('should first', () => {
    expect(1).toBe(1)
})


it("Tss", () => {
    const component = renderer.create(
        <Item value='Name'></Item>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();

    // manually trigger the callback
    renderer.act(() => {
        tree.props.onMouseEnter();
    });
    // re-rendering
    tree = component.toJSON();
    expect(tree).toMatchSnapshot();

    // manually trigger the callback
    renderer.act(() => {
        tree.props.onMouseLeave();
    });
    // re-rendering
    tree = component.toJSON();
    expect(tree).toMatchSnapshot();

})