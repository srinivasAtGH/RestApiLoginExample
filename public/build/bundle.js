
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Login.svelte generated by Svelte v3.23.0 */
    const file = "src\\Login.svelte";

    function create_fragment(ctx) {
    	let div;
    	let form;
    	let label0;
    	let input0;
    	let t0;
    	let label1;
    	let input1;
    	let t1;
    	let label2;
    	let t2;
    	let t3;
    	let button;
    	let t4;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			form = element("form");
    			label0 = element("label");
    			input0 = element("input");
    			t0 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t1 = space();
    			label2 = element("label");
    			t2 = text(/*logResponse*/ ctx[2]);
    			t3 = space();
    			button = element("button");
    			t4 = text("Login");
    			attr_dev(input0, "placeholder", "enter your name");
    			add_location(input0, file, 54, 6, 1179);
    			add_location(label0, file, 53, 4, 1164);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "placeholder", "enter password");
    			add_location(input1, file, 57, 6, 1275);
    			add_location(label1, file, 56, 4, 1260);
    			add_location(label2, file, 62, 4, 1398);
    			button.disabled = button_disabled_value = !/*username*/ ctx[0] || !/*username*/ ctx[0];
    			attr_dev(button, "type", "submit");
    			add_location(button, file, 63, 4, 1432);
    			add_location(form, file, 51, 2, 1110);
    			attr_dev(div, "class", "box svelte-twiwyu");
    			add_location(div, file, 50, 0, 1089);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, form);
    			append_dev(form, label0);
    			append_dev(label0, input0);
    			set_input_value(input0, /*username*/ ctx[0]);
    			append_dev(form, t0);
    			append_dev(form, label1);
    			append_dev(label1, input1);
    			set_input_value(input1, /*password*/ ctx[1]);
    			append_dev(form, t1);
    			append_dev(form, label2);
    			append_dev(label2, t2);
    			append_dev(form, t3);
    			append_dev(form, button);
    			append_dev(button, t4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[3]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
    				set_input_value(input0, /*username*/ ctx[0]);
    			}

    			if (dirty & /*password*/ 2 && input1.value !== /*password*/ ctx[1]) {
    				set_input_value(input1, /*password*/ ctx[1]);
    			}

    			if (dirty & /*logResponse*/ 4) set_data_dev(t2, /*logResponse*/ ctx[2]);

    			if (dirty & /*username*/ 1 && button_disabled_value !== (button_disabled_value = !/*username*/ ctx[0] || !/*username*/ ctx[0])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

    	function sayHello() {
    		dispatch("message", { text: "Hello!" });
    	}

    	let username = "";
    	let password = "";
    	let logResponse = "";

    	function handleSubmit(e) {
    		e.preventDefault();
    		let responseJson = AuthenticateUser();
    	}

    	async function AuthenticateUser() {
    		let response = await fetch("http://127.0.0.1:5000/login/", {
    			method: "POST",
    			headers: {
    				accept: "application/json",
    				"content-type": "application/json"
    			},
    			body: JSON.stringify({ username, password })
    		});

    		let result = await response.json();

    		if (response.status === 200) {
    			dispatch("userAuthenticated");
    		} else {
    			$$invalidate(2, logResponse = result.message);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Login", $$slots, []);

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(0, username);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(1, password);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		sayHello,
    		username,
    		password,
    		logResponse,
    		handleSubmit,
    		AuthenticateUser
    	});

    	$$self.$inject_state = $$props => {
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("password" in $$props) $$invalidate(1, password = $$props.password);
    		if ("logResponse" in $$props) $$invalidate(2, logResponse = $$props.logResponse);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		password,
    		logResponse,
    		handleSubmit,
    		dispatch,
    		sayHello,
    		AuthenticateUser,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\Home.svelte generated by Svelte v3.23.0 */

    const file$1 = "src\\Home.svelte";

    // (17:8) Home page content
    function fallback_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Home page content");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(17:8) Home page content",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(div, "class", "box svelte-twiwyu");
    			add_location(div, file$1, 15, 0, 226);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, $$slots];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\Register.svelte generated by Svelte v3.23.0 */

    const file$2 = "src\\Register.svelte";

    // (105:4) {:else}
    function create_else_block(ctx) {
    	let label;
    	let t;

    	const block = {
    		c: function create() {
    			label = element("label");
    			t = text(/*registerresponse*/ ctx[4]);
    			attr_dev(label, "class", "error svelte-15qdatv");
    			add_location(label, file$2, 105, 6, 2498);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*registerresponse*/ 16) set_data_dev(t, /*registerresponse*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(105:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (103:4) {#if userregistered}
    function create_if_block(ctx) {
    	let label;
    	let t;

    	const block = {
    		c: function create() {
    			label = element("label");
    			t = text(/*registerresponse*/ ctx[4]);
    			attr_dev(label, "class", "success svelte-15qdatv");
    			add_location(label, file$2, 103, 6, 2428);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*registerresponse*/ 16) set_data_dev(t, /*registerresponse*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(103:4) {#if userregistered}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let form;
    	let h1;
    	let t1;
    	let label0;
    	let input0;
    	let t2;
    	let label1;
    	let input1;
    	let t3;
    	let label2;
    	let input2;
    	let t4;
    	let label3;
    	let input3;
    	let t5;
    	let label4;
    	let input4;
    	let t6;
    	let t7;
    	let label5;
    	let input5;
    	let t8;
    	let t9;
    	let label6;
    	let input6;
    	let t10;
    	let t11;
    	let t12;
    	let button;
    	let t13;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*userregistered*/ ctx[8]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			form = element("form");
    			h1 = element("h1");
    			h1.textContent = "Register";
    			t1 = space();
    			label0 = element("label");
    			input0 = element("input");
    			t2 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t3 = space();
    			label2 = element("label");
    			input2 = element("input");
    			t4 = space();
    			label3 = element("label");
    			input3 = element("input");
    			t5 = space();
    			label4 = element("label");
    			input4 = element("input");
    			t6 = text("\r\n      Want a mentor");
    			t7 = space();
    			label5 = element("label");
    			input5 = element("input");
    			t8 = text("\r\n      Want to be a mentor");
    			t9 = space();
    			label6 = element("label");
    			input6 = element("input");
    			t10 = text("\r\n      Terms and conditions are ok.");
    			t11 = space();
    			if_block.c();
    			t12 = space();
    			button = element("button");
    			t13 = text("Register");
    			add_location(h1, file$2, 69, 4, 1616);
    			attr_dev(input0, "placeholder", "enter name");
    			add_location(input0, file$2, 71, 6, 1654);
    			add_location(label0, file$2, 70, 4, 1639);
    			attr_dev(input1, "placeholder", "enter user name");
    			add_location(input1, file$2, 75, 6, 1743);
    			add_location(label1, file$2, 74, 4, 1728);
    			attr_dev(input2, "type", "password");
    			attr_dev(input2, "placeholder", "enter password");
    			add_location(input2, file$2, 79, 6, 1841);
    			add_location(label2, file$2, 78, 4, 1826);
    			attr_dev(input3, "placeholder", "enter email");
    			add_location(input3, file$2, 85, 6, 1979);
    			add_location(label3, file$2, 84, 4, 1964);
    			attr_dev(input4, "type", "checkbox");
    			add_location(input4, file$2, 88, 6, 2068);
    			add_location(label4, file$2, 87, 4, 2053);
    			attr_dev(input5, "type", "checkbox");
    			add_location(input5, file$2, 93, 6, 2173);
    			add_location(label5, file$2, 92, 4, 2158);
    			attr_dev(input6, "type", "checkbox");
    			add_location(input6, file$2, 98, 6, 2284);
    			add_location(label6, file$2, 97, 4, 2269);
    			button.disabled = button_disabled_value = !/*username*/ ctx[1] || !/*username*/ ctx[1] || !/*email*/ ctx[3];
    			attr_dev(button, "type", "submit");
    			add_location(button, file$2, 107, 4, 2562);
    			add_location(form, file$2, 68, 2, 1564);
    			attr_dev(div, "class", "box svelte-15qdatv");
    			add_location(div, file$2, 67, 0, 1543);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, form);
    			append_dev(form, h1);
    			append_dev(form, t1);
    			append_dev(form, label0);
    			append_dev(label0, input0);
    			set_input_value(input0, /*name*/ ctx[0]);
    			append_dev(form, t2);
    			append_dev(form, label1);
    			append_dev(label1, input1);
    			set_input_value(input1, /*username*/ ctx[1]);
    			append_dev(form, t3);
    			append_dev(form, label2);
    			append_dev(label2, input2);
    			set_input_value(input2, /*password*/ ctx[2]);
    			append_dev(form, t4);
    			append_dev(form, label3);
    			append_dev(label3, input3);
    			set_input_value(input3, /*email*/ ctx[3]);
    			append_dev(form, t5);
    			append_dev(form, label4);
    			append_dev(label4, input4);
    			input4.checked = /*mentee*/ ctx[7];
    			append_dev(label4, t6);
    			append_dev(form, t7);
    			append_dev(form, label5);
    			append_dev(label5, input5);
    			input5.checked = /*mentor*/ ctx[6];
    			append_dev(label5, t8);
    			append_dev(form, t9);
    			append_dev(form, label6);
    			append_dev(label6, input6);
    			input6.checked = /*termsconditionsok*/ ctx[5];
    			append_dev(label6, t10);
    			append_dev(form, t11);
    			if_block.m(form, null);
    			append_dev(form, t12);
    			append_dev(form, button);
    			append_dev(button, t13);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[12]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[13]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[14]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[15]),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[16]),
    					listen_dev(input6, "change", /*input6_change_handler*/ ctx[17]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[9]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1 && input0.value !== /*name*/ ctx[0]) {
    				set_input_value(input0, /*name*/ ctx[0]);
    			}

    			if (dirty & /*username*/ 2 && input1.value !== /*username*/ ctx[1]) {
    				set_input_value(input1, /*username*/ ctx[1]);
    			}

    			if (dirty & /*password*/ 4 && input2.value !== /*password*/ ctx[2]) {
    				set_input_value(input2, /*password*/ ctx[2]);
    			}

    			if (dirty & /*email*/ 8 && input3.value !== /*email*/ ctx[3]) {
    				set_input_value(input3, /*email*/ ctx[3]);
    			}

    			if (dirty & /*mentee*/ 128) {
    				input4.checked = /*mentee*/ ctx[7];
    			}

    			if (dirty & /*mentor*/ 64) {
    				input5.checked = /*mentor*/ ctx[6];
    			}

    			if (dirty & /*termsconditionsok*/ 32) {
    				input6.checked = /*termsconditionsok*/ ctx[5];
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(form, t12);
    				}
    			}

    			if (dirty & /*username, email*/ 10 && button_disabled_value !== (button_disabled_value = !/*username*/ ctx[1] || !/*username*/ ctx[1] || !/*email*/ ctx[3])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let name = "";
    	let username = "";
    	let password = "";
    	let email = "";
    	let registerresponse = "";
    	let termsconditionsok = false;
    	let mentor = false;
    	let mentee = false;
    	let userregistered = false;

    	function handleSubmit(e) {
    		e.preventDefault();
    		let responseJson = AuthenticateUser();
    	}

    	async function AuthenticateUser() {
    		$$invalidate(4, registerresponse = "");

    		let response = await fetch("http://127.0.0.1:5000/register/", {
    			method: "POST",
    			headers: {
    				accept: "application/json",
    				"content-type": "application/json"
    			},
    			body: JSON.stringify({
    				name,
    				username,
    				password,
    				email,
    				terms_and_conditions_checked: termsconditionsok,
    				need_mentoring: mentee,
    				available_to_mentor: mentor
    			})
    		});

    		let result = await response.json();

    		if (response.status !== 200) {
    			$$invalidate(8, userregistered = false);
    			$$invalidate(4, registerresponse = result.message);
    		} else {
    			$$invalidate(8, userregistered = true);
    			$$invalidate(4, registerresponse = "User was created successfully.A confirmation email has been sent via email. After confirming your email you can login");
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Register> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Register", $$slots, []);

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	function input1_input_handler() {
    		username = this.value;
    		$$invalidate(1, username);
    	}

    	function input2_input_handler() {
    		password = this.value;
    		$$invalidate(2, password);
    	}

    	function input3_input_handler() {
    		email = this.value;
    		$$invalidate(3, email);
    	}

    	function input4_change_handler() {
    		mentee = this.checked;
    		$$invalidate(7, mentee);
    	}

    	function input5_change_handler() {
    		mentor = this.checked;
    		$$invalidate(6, mentor);
    	}

    	function input6_change_handler() {
    		termsconditionsok = this.checked;
    		$$invalidate(5, termsconditionsok);
    	}

    	$$self.$capture_state = () => ({
    		name,
    		username,
    		password,
    		email,
    		registerresponse,
    		termsconditionsok,
    		mentor,
    		mentee,
    		userregistered,
    		handleSubmit,
    		AuthenticateUser
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("username" in $$props) $$invalidate(1, username = $$props.username);
    		if ("password" in $$props) $$invalidate(2, password = $$props.password);
    		if ("email" in $$props) $$invalidate(3, email = $$props.email);
    		if ("registerresponse" in $$props) $$invalidate(4, registerresponse = $$props.registerresponse);
    		if ("termsconditionsok" in $$props) $$invalidate(5, termsconditionsok = $$props.termsconditionsok);
    		if ("mentor" in $$props) $$invalidate(6, mentor = $$props.mentor);
    		if ("mentee" in $$props) $$invalidate(7, mentee = $$props.mentee);
    		if ("userregistered" in $$props) $$invalidate(8, userregistered = $$props.userregistered);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		username,
    		password,
    		email,
    		registerresponse,
    		termsconditionsok,
    		mentor,
    		mentee,
    		userregistered,
    		handleSubmit,
    		AuthenticateUser,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_change_handler,
    		input5_change_handler,
    		input6_change_handler
    	];
    }

    class Register extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Register",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.23.0 */
    const file$3 = "src\\App.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div0;
    	let div0_hidden_value;
    	let t2;
    	let div1;
    	let div1_hidden_value;
    	let t3;
    	let div2;
    	let div2_hidden_value;
    	let t4;
    	let div3;
    	let button0;
    	let t5;
    	let t6;
    	let button1;
    	let t7;
    	let t8;
    	let button2;
    	let t9;
    	let button2_hidden_value;
    	let current;
    	let mounted;
    	let dispose;
    	const login_1 = new Login({ $$inline: true });
    	login_1.$on("userAuthenticated", /*onUserAuthenticated*/ ctx[6]);
    	const home = new Home({ $$inline: true });
    	const registetr = new Register({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Learning web";
    			t1 = space();
    			div0 = element("div");
    			create_component(login_1.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			create_component(home.$$.fragment);
    			t3 = space();
    			div2 = element("div");
    			create_component(registetr.$$.fragment);
    			t4 = space();
    			div3 = element("div");
    			button0 = element("button");
    			t5 = text("Register");
    			t6 = space();
    			button1 = element("button");
    			t7 = text("Login");
    			t8 = space();
    			button2 = element("button");
    			t9 = text("Log out");
    			attr_dev(h1, "class", "badge svelte-47mr4k");
    			add_location(h1, file$3, 79, 2, 1351);
    			div0.hidden = div0_hidden_value = !/*showLoginPage*/ ctx[0];
    			add_location(div0, file$3, 80, 2, 1389);
    			div1.hidden = div1_hidden_value = !/*userAuthenticated*/ ctx[2];
    			add_location(div1, file$3, 83, 2, 1487);
    			div2.hidden = div2_hidden_value = !/*showRegisterPage*/ ctx[1];
    			add_location(div2, file$3, 87, 2, 1546);
    			button0.hidden = /*userAuthenticated*/ ctx[2];
    			attr_dev(button0, "class", "linkbutton svelte-47mr4k");
    			add_location(button0, file$3, 92, 4, 1637);
    			button1.hidden = /*userAuthenticated*/ ctx[2];
    			attr_dev(button1, "class", "linkbutton svelte-47mr4k");
    			add_location(button1, file$3, 96, 4, 1746);
    			button2.hidden = button2_hidden_value = !/*userAuthenticated*/ ctx[2];
    			attr_dev(button2, "class", "linkbutton svelte-47mr4k");
    			add_location(button2, file$3, 100, 4, 1849);
    			attr_dev(div3, "class", "topcorner svelte-47mr4k");
    			add_location(div3, file$3, 91, 2, 1609);
    			attr_dev(main, "class", "svelte-47mr4k");
    			add_location(main, file$3, 78, 0, 1342);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div0);
    			mount_component(login_1, div0, null);
    			append_dev(main, t2);
    			append_dev(main, div1);
    			mount_component(home, div1, null);
    			append_dev(main, t3);
    			append_dev(main, div2);
    			mount_component(registetr, div2, null);
    			append_dev(main, t4);
    			append_dev(main, div3);
    			append_dev(div3, button0);
    			append_dev(button0, t5);
    			append_dev(div3, t6);
    			append_dev(div3, button1);
    			append_dev(button1, t7);
    			append_dev(div3, t8);
    			append_dev(div3, button2);
    			append_dev(button2, t9);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*register*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*login*/ ctx[4], false, false, false),
    					listen_dev(button2, "click", /*logout*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*showLoginPage*/ 1 && div0_hidden_value !== (div0_hidden_value = !/*showLoginPage*/ ctx[0])) {
    				prop_dev(div0, "hidden", div0_hidden_value);
    			}

    			if (!current || dirty & /*userAuthenticated*/ 4 && div1_hidden_value !== (div1_hidden_value = !/*userAuthenticated*/ ctx[2])) {
    				prop_dev(div1, "hidden", div1_hidden_value);
    			}

    			if (!current || dirty & /*showRegisterPage*/ 2 && div2_hidden_value !== (div2_hidden_value = !/*showRegisterPage*/ ctx[1])) {
    				prop_dev(div2, "hidden", div2_hidden_value);
    			}

    			if (!current || dirty & /*userAuthenticated*/ 4) {
    				prop_dev(button0, "hidden", /*userAuthenticated*/ ctx[2]);
    			}

    			if (!current || dirty & /*userAuthenticated*/ 4) {
    				prop_dev(button1, "hidden", /*userAuthenticated*/ ctx[2]);
    			}

    			if (!current || dirty & /*userAuthenticated*/ 4 && button2_hidden_value !== (button2_hidden_value = !/*userAuthenticated*/ ctx[2])) {
    				prop_dev(button2, "hidden", button2_hidden_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login_1.$$.fragment, local);
    			transition_in(home.$$.fragment, local);
    			transition_in(registetr.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login_1.$$.fragment, local);
    			transition_out(home.$$.fragment, local);
    			transition_out(registetr.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(login_1);
    			destroy_component(home);
    			destroy_component(registetr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let showLoginPage = true;
    	let showHomePage = false;
    	let showRegisterPage = false;
    	let userAuthenticated = false;

    	function logout() {
    		$$invalidate(2, userAuthenticated = false);
    		$$invalidate(0, showLoginPage = true);
    	}

    	function login() {
    		$$invalidate(0, showLoginPage = true);
    		$$invalidate(1, showRegisterPage = false);
    	}

    	function register() {
    		$$invalidate(0, showLoginPage = false);
    		$$invalidate(1, showRegisterPage = true);
    	}

    	function onUserAuthenticated(event) {
    		$$invalidate(2, userAuthenticated = true);
    		$$invalidate(0, showLoginPage = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Login,
    		Home,
    		Registetr: Register,
    		showLoginPage,
    		showHomePage,
    		showRegisterPage,
    		userAuthenticated,
    		logout,
    		login,
    		register,
    		onUserAuthenticated
    	});

    	$$self.$inject_state = $$props => {
    		if ("showLoginPage" in $$props) $$invalidate(0, showLoginPage = $$props.showLoginPage);
    		if ("showHomePage" in $$props) showHomePage = $$props.showHomePage;
    		if ("showRegisterPage" in $$props) $$invalidate(1, showRegisterPage = $$props.showRegisterPage);
    		if ("userAuthenticated" in $$props) $$invalidate(2, userAuthenticated = $$props.userAuthenticated);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showLoginPage,
    		showRegisterPage,
    		userAuthenticated,
    		logout,
    		login,
    		register,
    		onUserAuthenticated
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
