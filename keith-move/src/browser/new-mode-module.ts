/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { ContainerModule } from "inversify";
import { TYPES, configureCommand, MoveCommand, LocationDecorator, MoveMouseListener } from "sprotty";
import { NewMouseListener } from "./newMouseListener"

export const newMoveModule = new ContainerModule((bind, _unbind, isBound, rebind) => {
    bind(NewMouseListener).toSelf().inSingletonScope()
    bind(TYPES.MouseListener).toService(NewMouseListener)
    bind(MoveMouseListener).toService(NewMouseListener)
    configureCommand({ bind, isBound }, MoveCommand);
    bind(TYPES.IVNodeDecorator).to(LocationDecorator);
    bind(TYPES.HiddenVNodeDecorator).to(LocationDecorator);
});

export default newMoveModule;
