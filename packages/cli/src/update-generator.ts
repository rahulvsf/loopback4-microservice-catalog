﻿// Copyright (c) 2023 Sourcefuse Technologies
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import * as Generator from 'yeoman-generator';
import UpdateGeneratorLb4 from '@loopback/cli/generators/update';
export default class UpdateGenerator<
  T extends Generator.GeneratorOptions,
> extends UpdateGeneratorLb4<T> {}
